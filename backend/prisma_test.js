require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

async function main() {
  try {
    console.log('DATABASE_URL=', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('connected');
    const count = await prisma.user.count();
    console.log('count=', count);
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
