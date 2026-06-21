const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
