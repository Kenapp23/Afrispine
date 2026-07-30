import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSenderAuth(req);

    const body = await req.json();
    const { firstName, lastName, phone, dob, countryOfResidence } = body;

    // Build update data — only include fields that are provided
    const data: Record<string, string> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (phone !== undefined) data.phone = phone;
    if (dob !== undefined) data.dob = dob;
    if (countryOfResidence !== undefined) data.countryOfResidence = countryOfResidence;

    const updated = await db.sender.update({
      where: { id: auth.id },
      data,
    });

    const { passwordHash: _, ...safe } = updated;
    return NextResponse.json({ sender: safe });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}