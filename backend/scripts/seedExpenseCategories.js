/**
 * One-time script: replaces old default expense categories with the full 15-category list.
 * Safe to run multiple times — skips users who already have expenses recorded.
 *
 * Usage:
 *   node scripts/seedExpenseCategories.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CATEGORIES = require('../src/config/expenseCategories');

async function seed() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log(`Found ${users.length} user(s).`);

  for (const user of users) {
    console.log(`\nProcessing: ${user.email}`);

    // Find categories that have no linked expenses (safe to replace)
    const existingCats = await prisma.expenseCategory.findMany({
      where: { userId: user.id },
      include: { _count: { select: { expenses: true } } },
    });

    const catsWithExpenses = existingCats.filter(c => c._count.expenses > 0);
    const catsWithoutExpenses = existingCats.filter(c => c._count.expenses === 0);

    if (catsWithExpenses.length > 0) {
      console.log(`  ⚠️  ${catsWithExpenses.length} category/categories have expenses — keeping them.`);
      console.log(`     Kept: ${catsWithExpenses.map(c => c.name).join(', ')}`);
    }

    // Delete empty old categories
    if (catsWithoutExpenses.length > 0) {
      await prisma.expenseCategory.deleteMany({
        where: { id: { in: catsWithoutExpenses.map(c => c.id) } },
      });
      console.log(`  🗑  Removed ${catsWithoutExpenses.length} empty old category/categories.`);
    }

    // Find which of the 15 categories already exist by name (from kept cats)
    const existingNames = new Set(catsWithExpenses.map(c => c.name));
    const toCreate = CATEGORIES.filter(c => !existingNames.has(c.name));

    if (toCreate.length === 0) {
      console.log(`  ✅ All 15 categories already present — nothing to add.`);
      continue;
    }

    await prisma.expenseCategory.createMany({
      data: toCreate.map(c => ({ ...c, userId: user.id })),
    });

    console.log(`  ✅ Created ${toCreate.length} categories.`);
  }

  console.log('\nDone.');
}

seed()
  .catch(e => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
