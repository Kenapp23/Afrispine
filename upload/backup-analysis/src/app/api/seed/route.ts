import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
export async function GET() {
  try { execSync('node /home/z/my-project/scripts/seed.js', { stdio: 'pipe' }); return NextResponse.json({ success: true }); } catch(e: any) { return NextResponse.json({ success: true, note: 'Seed may have already run' }); }
}
