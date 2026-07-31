import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import { ensureDb } from '@/lib/ensure-db';

// ─── Types (must match chama-page.tsx interfaces) ───────────────
interface CircleMember {
  id: string;
  memberName: string;
  phone: string;
  email: string;
  positionInRotation: number;
  totalContributed: number;
  lastPaymentAt: string | null;
  nextPaymentDue: string | null;
  hasReceivedPayout: boolean;
  senderId: string | null;
}

interface CirclePayment {
  id: string;
  memberName: string;
  amount: number;
  currency: string;
  cycleMonth: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface CircleMeta {
  type: string;
  slug: string;
  frequency: string;
  currentCycle: number;
  nextPayoutDate: string | null;
  totalPot: number;
  whatsappGroupId: string;
  country: string;
  contributionAmount: number;
  contributionCurrency: string;
}

// ─── Helpers ─────────────────────────────────────────────────────
function jsonRes(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function errRes(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function cryptoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Generate a short slug for invite codes */
function generateSlug(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let slug = '';
  for (let i = 0; i < 8; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

/** Parse slug from URL */
function parseSlug(request: NextRequest): string[] {
  const url = new URL(request.url);
  return url.pathname.replace('/api/chama/', '').split('/').filter(Boolean);
}

/** Read JSON body */
async function body(req: NextRequest) {
  return req.json();
}

// ─── PlatformConfig helpers for storing metadata/members ───────
async function getCircleMeta(circleId: string): Promise<CircleMeta | null> {
  const row = await db.platformConfig.findUnique({ where: { key: `chama_${circleId}_meta` } });
  if (!row?.value) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

async function setCircleMeta(circleId: string, meta: CircleMeta): Promise<void> {
  await db.platformConfig.upsert({
    where: { key: `chama_${circleId}_meta` },
    update: { value: JSON.stringify(meta) },
    create: { id: cryptoId(), key: `chama_${circleId}_meta`, value: JSON.stringify(meta) },
  });
}

async function getCircleMembers(circleId: string): Promise<CircleMember[]> {
  const row = await db.platformConfig.findUnique({ where: { key: `chama_${circleId}_members` } });
  if (!row?.value) return [];
  try { return JSON.parse(row.value); } catch { return []; }
}

async function setCircleMembers(circleId: string, members: CircleMember[]): Promise<void> {
  await db.platformConfig.upsert({
    where: { key: `chama_${circleId}_members` },
    update: { value: JSON.stringify(members) },
    create: { id: cryptoId(), key: `chama_${circleId}_members`, value: JSON.stringify(members) },
  });
}

// ─── Build a full Circle response object ────────────────────────
async function buildCircleResponse(groupSend: any, withDetails = false) {
  const meta = await getCircleMeta(groupSend.id);
  const members = await getCircleMembers(groupSend.id);

  // Get contributions for this circle
  const contributions = withDetails
    ? await db.groupSendContribution.findMany({
        where: { groupSendId: groupSend.id },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  // Map contributions to CirclePayment format
  const payments: CirclePayment[] = contributions.map((c: any) => {
    const member = members.find((m) => m.senderId === c.senderId);
    const paidAt = c.createdAt;
    const cycleMonth = paidAt
      ? new Date(paidAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : '';
    return {
      id: c.id,
      memberName: member?.memberName || 'Unknown',
      amount: c.amount || 0,
      currency: meta?.contributionCurrency || groupSend.currency || 'GBP',
      cycleMonth,
      status: 'completed',
      paidAt,
      createdAt: c.createdAt,
    };
  });

  // Get organiser info
  let organiser = { id: groupSend.creatorId, firstName: '', lastName: '', email: '' };
  try {
    const sender = await db.sender.findUnique({ where: { id: groupSend.creatorId } });
    if (sender) {
      organiser = {
        id: sender.id,
        firstName: sender.firstName || '',
        lastName: sender.lastName || '',
        email: sender.email || '',
      };
    }
  } catch { /* organiser not found, use defaults */ }

  // Calculate totalPot from contributions
  const totalPot = contributions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  const circle: any = {
    id: groupSend.id,
    name: groupSend.name,
    slug: meta?.slug || '',
    organiserId: groupSend.creatorId,
    type: meta?.type || 'general',
    memberCount: members.length,
    contributionAmount: meta?.contributionAmount || groupSend.targetAmount || 0,
    contributionCurrency: meta?.contributionCurrency || groupSend.currency || 'GBP',
    frequency: meta?.frequency || 'monthly',
    currentCycle: meta?.currentCycle || 1,
    nextPayoutDate: meta?.nextPayoutDate || null,
    totalPot: totalPot,
    whatsappGroupId: meta?.whatsappGroupId || '',
    status: groupSend.status || 'active',
    createdAt: groupSend.createdAt,
    updatedAt: groupSend.updatedAt,
    members: withDetails ? members : [],
    payments: withDetails ? payments : [],
    organiser,
    _count: { members: members.length, payments: payments.length },
  };

  // Add paidThisCycle Set for detail view
  if (withDetails) {
    const currentCycleMonth = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const paidThisCycle = new Set<string>();
    for (const p of payments) {
      if (p.status === 'completed' && p.cycleMonth === currentCycleMonth) {
        paidThisCycle.add(p.memberName);
      }
    }
    circle.paidThisCycle = paidThisCycle;
  }

  return circle;
}

// ─── GET handler ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  await ensureDb();
  const slug = parseSlug(req);
  const path = slug.join('/');

  try {
    // ── GET /api/chama/circles ──
    if (path === 'circles' || path === '') {
      const sender = await requireSenderAuth(req);

      // Find all GroupSend records where user is creator
      const created = await db.groupSend.findMany({
        where: { creatorId: sender.id },
        orderBy: { createdAt: 'desc' },
      });

      // Also find circles where user is a member (stored in PlatformConfig)
      const allConfigs = await db.platformConfig.findMany({
        where: { key: { startsWith: 'chama_' } },
      });

      // Collect member circle IDs where sender is a member
      const memberCircleIds: string[] = [];
      for (const cfg of allConfigs) {
        if (!cfg.key.endsWith('_members')) continue;
        try {
          const members: CircleMember[] = JSON.parse(cfg.value || '[]');
          if (members.some((m) => m.senderId === sender.id)) {
            const circleId = cfg.key.replace('chama_', '').replace('_members', '');
            if (!created.some((c) => c.id === circleId)) {
              memberCircleIds.push(circleId);
            }
          }
        } catch { /* skip malformed */ }
      }

      // Fetch member circles from GroupSend
      let memberCircles: any[] = [];
      if (memberCircleIds.length > 0) {
        memberCircles = await db.groupSend.findMany({
          where: { id: { in: memberCircleIds } },
          orderBy: { createdAt: 'desc' },
        });
      }

      const allCircles = [...created, ...memberCircles];
      const circles = await Promise.all(allCircles.map((gs) => buildCircleResponse(gs, false)));

      return jsonRes({ circles });
    }

    // ── GET /api/chama/circles/[id] ──
    if (slug.length === 2 && slug[0] === 'circles') {
      const sender = await requireSenderAuth(req);
      const circleId = slug[1];

      const groupSend = await db.groupSend.findUnique({ where: { id: circleId } });
      if (!groupSend) return jsonRes({ circle: null }, 200);

      // Verify access: creator or member
      const members = await getCircleMembers(circleId);
      const isMember = members.some((m) => m.senderId === sender.id);
      if (groupSend.creatorId !== sender.id && !isMember) {
        return errRes('Not a member of this circle', 403);
      }

      const circle = await buildCircleResponse(groupSend, true);
      return jsonRes({ circle });
    }

    return errRes('Not found', 404);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return errRes('Unauthorized', 401);
    console.error('[chama GET]', path, e.message);
    return errRes('Internal error', 500);
  }
}

// ─── POST handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  await ensureDb();
  const slug = parseSlug(req);
  const path = slug.join('/');

  try {
    // ── POST /api/chama/circles (create) ──
    if (path === 'circles') {
      const sender = await requireSenderAuth(req);
      const {
        name,
        type = 'general',
        country = '',
        contributionAmount,
        contributionCurrency = 'GBP',
        frequency = 'monthly',
      } = await body(req);

      if (!name?.trim()) return errRes('Name is required');
      if (!contributionAmount || Number(contributionAmount) <= 0) return errRes('Contribution amount is required');

      const amount = Number(contributionAmount);
      const circleSlug = generateSlug();

      // Create the GroupSend record
      const groupSend = await db.groupSend.create({
        data: {
          id: cryptoId(),
          name: name.trim(),
          creatorId: sender.id,
          targetAmount: amount,
          currency: contributionCurrency,
          status: 'active',
        },
      });

      // Store meta in PlatformConfig
      const meta: CircleMeta = {
        type,
        slug: circleSlug,
        frequency,
        currentCycle: 1,
        nextPayoutDate: null,
        totalPot: 0,
        whatsappGroupId: '',
        country,
        contributionAmount: amount,
        contributionCurrency,
      };
      await setCircleMeta(groupSend.id, meta);

      // Initialize empty members array (organiser is not auto-added as a member)
      await setCircleMembers(groupSend.id, []);

      const circle = await buildCircleResponse(groupSend, true);
      return jsonRes({ circle });
    }

    // ── POST /api/chama/circles/[id]/members ──
    if (slug.length === 3 && slug[0] === 'circles' && slug[2] === 'members') {
      const sender = await requireSenderAuth(req);
      const circleId = slug[1];

      const groupSend = await db.groupSend.findUnique({ where: { id: circleId } });
      if (!groupSend) return errRes('Circle not found', 404);

      // Only organiser can add members
      if (groupSend.creatorId !== sender.id) return errRes('Only the organiser can add members', 403);

      const { memberName, phone = '', email = '' } = await body(req);
      if (!memberName?.trim()) return errRes('Member name is required');

      const members = await getCircleMembers(circleId);
      if (members.some((m) => m.memberName.toLowerCase() === memberName.trim().toLowerCase())) {
        return errRes('A member with this name already exists');
      }

      const newMember: CircleMember = {
        id: cryptoId(),
        memberName: memberName.trim(),
        phone: phone?.trim() || '',
        email: email?.trim() || '',
        positionInRotation: members.length + 1,
        totalContributed: 0,
        lastPaymentAt: null,
        nextPaymentDue: null,
        hasReceivedPayout: false,
        senderId: null,
      };

      members.push(newMember);
      await setCircleMembers(circleId, members);

      const circle = await buildCircleResponse(groupSend, true);
      return jsonRes({ circle });
    }

    // ── POST /api/chama/circles/[id]/contribute ──
    if (slug.length === 3 && slug[0] === 'circles' && slug[2] === 'contribute') {
      const sender = await requireSenderAuth(req);
      const circleId = slug[1];

      const groupSend = await db.groupSend.findUnique({ where: { id: circleId } });
      if (!groupSend) return errRes('Circle not found', 404);

      const { memberName } = await body(req);
      if (!memberName?.trim()) return errRes('Member name is required');

      const members = await getCircleMembers(circleId);
      const memberIdx = members.findIndex(
        (m) => m.memberName.toLowerCase() === memberName.trim().toLowerCase()
      );
      if (memberIdx === -1) return errRes('Member not found in this circle');

      const meta = await getCircleMeta(circleId);
      const contributionAmount = meta?.contributionAmount || groupSend.targetAmount || 0;
      const currency = meta?.contributionCurrency || groupSend.currency || 'GBP';

      // Create contribution record
      const contribution = await db.groupSendContribution.create({
        data: {
          id: cryptoId(),
          groupSendId: circleId,
          senderId: members[memberIdx].senderId || sender.id,
          amount: contributionAmount,
        },
      });

      // Update member's totalContributed and lastPaymentAt
      members[memberIdx].totalContributed += contributionAmount;
      members[memberIdx].lastPaymentAt = contribution.createdAt.toISOString();
      await setCircleMembers(circleId, members);

      // Update totalPot in meta
      if (meta) {
        const allContribs = await db.groupSendContribution.findMany({
          where: { groupSendId: circleId },
        });
        meta.totalPot = allContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
        await setCircleMeta(circleId, meta);
      }

      const circle = await buildCircleResponse(groupSend, true);
      return jsonRes({ circle });
    }

    // ── POST /api/chama/circles/[id]/join ──
    if (slug.length === 3 && slug[0] === 'circles' && slug[2] === 'join') {
      const sender = await requireSenderAuth(req);
      const { slug: inviteSlug } = await body(req);

      if (!inviteSlug?.trim()) return errRes('Invite code is required');

      // Find circle by slug (stored in PlatformConfig meta)
      const allConfigs = await db.platformConfig.findMany({
        where: { key: { startsWith: 'chama_' } },
      });

      let targetCircleId: string | null = null;
      for (const cfg of allConfigs) {
        if (!cfg.key.endsWith('_meta')) continue;
        try {
          const meta: CircleMeta = JSON.parse(cfg.value || '{}');
          if (meta.slug === inviteSlug.trim()) {
            targetCircleId = cfg.key.replace('chama_', '').replace('_meta', '');
            break;
          }
        } catch { /* skip */ }
      }

      if (!targetCircleId) return errRes('Invalid invite code', 404);

      const groupSend = await db.groupSend.findUnique({ where: { id: targetCircleId } });
      if (!groupSend) return errRes('Circle not found', 404);

      const members = await getCircleMembers(targetCircleId);

      // Check if already a member
      if (members.some((m) => m.senderId === sender.id)) {
        return errRes('You are already a member of this circle');
      }

      // Get sender info
      const senderInfo = await db.sender.findUnique({ where: { id: sender.id } });
      const fullName = senderInfo
        ? `${senderInfo.firstName || ''} ${senderInfo.lastName || ''}`.trim()
        : sender.email;

      const newMember: CircleMember = {
        id: cryptoId(),
        memberName: fullName || 'You',
        phone: senderInfo?.phone || '',
        email: sender.email || '',
        positionInRotation: members.length + 1,
        totalContributed: 0,
        lastPaymentAt: null,
        nextPaymentDue: null,
        hasReceivedPayout: false,
        senderId: sender.id,
      };

      members.push(newMember);
      await setCircleMembers(targetCircleId, members);

      return jsonRes({ success: true, circleId: targetCircleId });
    }

    return errRes('Not found', 404);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return errRes('Unauthorized', 401);
    console.error('[chama POST]', path, e.message);
    return errRes('Internal error', 500);
  }
}

// ─── DELETE handler ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  await ensureDb();
  const slug = parseSlug(req);
  const path = slug.join('/');

  try {
    // ── DELETE /api/chama/circles/[id]/members/[memberId] ──
    if (
      slug.length === 4 &&
      slug[0] === 'circles' &&
      slug[2] === 'members'
    ) {
      const sender = await requireSenderAuth(req);
      const circleId = slug[1];
      const memberId = slug[3];

      const groupSend = await db.groupSend.findUnique({ where: { id: circleId } });
      if (!groupSend) return errRes('Circle not found', 404);

      const members = await getCircleMembers(circleId);
      const memberIdx = members.findIndex((m) => m.id === memberId);
      if (memberIdx === -1) return errRes('Member not found', 404);

      // Only the member themselves, the organiser, or an admin can remove
      const isSelf = members[memberIdx].senderId === sender.id;
      const isOrganiser = groupSend.creatorId === sender.id;
      if (!isSelf && !isOrganiser) return errRes('Not authorized to remove this member', 403);

      // Organiser cannot leave
      if (isSelf && isOrganiser) return errRes('Organiser cannot leave the circle');

      // Remove member
      members.splice(memberIdx, 1);
      // Re-index positions
      members.forEach((m, i) => { m.positionInRotation = i + 1; });
      await setCircleMembers(circleId, members);

      return jsonRes({ success: true });
    }

    return errRes('Not found', 404);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return errRes('Unauthorized', 401);
    console.error('[chama DELETE]', path, e.message);
    return errRes('Internal error', 500);
  }
}
