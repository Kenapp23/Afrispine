import { db } from '@/lib/db';
import { getCorridors } from '@/lib/fx';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sendCountry = url.searchParams.get('sendCountry');
  const receiveCountry = url.searchParams.get('receiveCountry');
  const where: any = { isActive: true };
  if (sendCountry) where.sendCountry = sendCountry;
  if (receiveCountry) where.receiveCountry = receiveCountry;
  const corridors = await db.corridor.findMany({ where, orderBy: { sendCountry: 'asc' } });
  return Response.json(corridors);
}