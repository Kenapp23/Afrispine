import { db } from '../src/lib/db';

async function main() {
  const rows = await db.merchant.findMany({
    select: { id: true, name: true, countryCode: true, category: true, logoUrl: true, domain: true, isActive: true },
    orderBy: { countryCode: 'asc' },
  });
  console.log(JSON.stringify(rows, null, 2));
  await db.$disconnect();
}
main();
