// Mock forgot password — in production sends reset email
export async function POST(req: Request) {
  const { email } = await req.json();
  console.log(`[AUTH] Password reset requested for ${email}`);
  return Response.json({ ok: true });
}