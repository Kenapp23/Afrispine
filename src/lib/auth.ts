import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const JWT_SENDER_SECRET = () => process.env.JWT_SENDER_SECRET || 'afri_spine_sender_jwt_secret_2024_change_in_production';
const JWT_ADMIN_SECRET = () => process.env.JWT_ADMIN_SECRET || 'afri_spine_admin_jwt_secret_2024_change_in_production';

export interface SenderJwtPayload {
  id: string;
  email: string;
  role: 'sender';
}

export interface AdminJwtPayload {
  id: string;
  email: string;
  role: 'admin';
}

export function signSenderToken(payload: SenderJwtPayload): string {
  return jwt.sign(payload, JWT_SENDER_SECRET(), { expiresIn: '7d' });
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_ADMIN_SECRET(), { expiresIn: '8h' });
}

export function verifySenderToken(token: string): SenderJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SENDER_SECRET()) as SenderJwtPayload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, JWT_ADMIN_SECRET()) as AdminJwtPayload;
  } catch {
    return null;
  }
}

/** Extract sender JWT from cookie or Authorization header */
export function getSenderFromRequest(req: Request): SenderJwtPayload | null {
  // Check cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/afrispine_session=([^;]+)/);
  if (match) {
    return verifySenderToken(match[1]);
  }
  // Check Authorization header
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return verifySenderToken(auth.slice(7));
  }
  return null;
}

/** Extract admin JWT from cookie or Authorization header */
export function getAdminFromRequest(req: Request): AdminJwtPayload | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/afrispine_admin_session=([^;]+)/);
  if (match) {
    return verifyAdminToken(match[1]);
  }
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return verifyAdminToken(auth.slice(7));
  }
  return null;
}

/** Require sender auth — returns payload or throws */
export async function requireSenderAuth(req: Request): Promise<SenderJwtPayload> {
  const payload = getSenderFromRequest(req);
  if (!payload) {
    throw new Error('Unauthorized');
  }
  return payload;
}

/** Alias for requireSenderAuth */
export const requireAuth = requireSenderAuth;

/** Require admin auth — returns { error, res, admin } or throws */
export async function requireAdmin(req: Request): Promise<{ error: string | null; res: Response | null; admin: AdminJwtPayload | null }> {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return {
      error: 'Unauthorized',
      res: new Response(JSON.stringify({ error: 'Admin authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } }),
      admin: null,
    };
  }
  return { error: null, res: null, admin };
}