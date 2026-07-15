/**
 * One-time script: activate all users created before email verification was added.
 * Run ONCE on the VM after deploying this feature:
 *   node backend/scripts/activateExistingUsers.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'ACTIVE', emailVerified: true },
  });

  console.log(`Activated ${result.count} existing user(s).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
