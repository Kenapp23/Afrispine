import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const [settingsRecs, margins, templates] = await Promise.all([
    db.platformSetting.findMany(),
    db.fxMarginOverride.findMany(),
    db.notificationTemplate.findMany(),
  ]);

  // Convert settings array to key-value map
  const settings: Record<string, string> = {};
  for (const s of settingsRecs) {
    settings[s.key] = s.value;
  }

  return NextResponse.json({ settings, margins, templates });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.res!;

  const body = await req.json();
  const { settings, margins, templates } = body;

  // Upsert PlatformSetting records by key
  if (settings && typeof settings === 'object') {
    for (const [key, value] of Object.entries(settings)) {
      await db.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
  }

  // Upsert FxMarginOverride by corridor
  if (Array.isArray(margins)) {
    for (const m of margins) {
      await db.fxMarginOverride.upsert({
        where: { corridor: m.corridor },
        update: { marginPct: Number(m.marginPct) },
        create: { corridor: m.corridor, marginPct: Number(m.marginPct) },
      });
    }
  }

  // Upsert NotificationTemplate by trigger
  if (Array.isArray(templates)) {
    for (const t of templates) {
      await db.notificationTemplate.upsert({
        where: { trigger: t.trigger },
        update: {
          channel: t.channel || 'email',
          subject: t.subject || '',
          body: t.body || '',
          smsBody: t.smsBody || '',
        },
        create: {
          trigger: t.trigger,
          channel: t.channel || 'email',
          subject: t.subject || '',
          body: t.body || '',
          smsBody: t.smsBody || '',
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}