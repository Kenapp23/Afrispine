import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, AdminJwtPayload } from './auth';

export async function requireAdmin(req: NextRequest): Promise<{
  error: string | null;
  res: NextResponse | null;
  admin: AdminJwtPayload | null;
}> {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return {
      error: 'Unauthorized',
      res: NextResponse.json({ error: 'Admin authentication required' }, { status: 401 }),
      admin: null,
    };
  }
  return { error: null, res: null, admin };
}

export function withAdminAuth(
  handler: (req: NextRequest, admin: AdminJwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.res!;
    return handler(req, auth.admin!);
  };
}
