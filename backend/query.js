const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT DISTINCT "TipoTransaccion" FROM "TransactionQr" LIMIT 5`;
  console.log(result);
}

main().finally(() => prisma.$disconnect());
