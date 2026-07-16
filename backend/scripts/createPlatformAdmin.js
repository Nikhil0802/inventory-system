/**
 * One-off operational script: create or reset a platform admin account.
 * Usage: node backend/scripts/createPlatformAdmin.js <email> <password> <name>
 *
 * Re-running with the same email upserts — this also doubles as a password
 * reset since there's no self-serve reset flow for platform admins.
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password || !name) {
    console.error('Usage: node backend/scripts/createPlatformAdmin.js <email> <password> <name>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: { password: hashedPassword, name },
    create: { email, password: hashedPassword, name },
  });

  console.log(`Platform admin ready: ${admin.email} (${admin.id})`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
