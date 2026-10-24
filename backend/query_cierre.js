const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT * FROM "CierreTransaccion" LIMIT 1`;
    console.log("Success:", result);
  } catch (e) {
    console.log("Error querying CierreTransaccion:");
    const result2 = await prisma.$queryRaw`SELECT * FROM information_schema.tables WHERE table_name ILIKE '%cierre%'`;
    console.log("Tables matching cierre:", result2);
  }
}

main().finally(() => prisma.$disconnect());
