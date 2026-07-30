import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, AdminJwtPayload } from '@/lib/auth';

type AdminHandler = (req: NextRequest) => Promise<Response>;

export async function requireAdmin(req: NextRequest): Promise<{ error: string | null; res: NextResponse | null; admin: AdminJwtPayload | null }> {
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

/** Higher-order wrapper for admin route handlers */
export function withAdminAuth(handler: (req: NextRequest) => Promise<Response>): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    const { res, admin } = await requireAdmin(req);
    if (res) return res;
    (req as any)._admin = admin;
    return handler(req);
  };
}