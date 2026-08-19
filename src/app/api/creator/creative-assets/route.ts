/**
 * Creative Assets API — Digital Publication Engine (MOAT §1)
 *
 * POST  /api/creator/creative-assets  — Upload source image + composite
 * GET   /api/creator/creative-assets  — List assets for a creator
 * PATCH /api/creator/creative-assets  — Approve / reject an asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { writeFile, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Local PrismaClient — works with SQLite (sandbox) & PostgreSQL (prod)
const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const ASSET_DIR = join(process.cwd(), 'public', 'creative-assets');

// Ensure asset directory exists on module load
if (!existsSync(ASSET_DIR)) {
  mkdirSync(ASSET_DIR, { recursive: true });
}

// ── Types ───────────────────────────────────────────────────────

type PresetType = 'poster' | 'digital_ticket' | 'flyer';

interface CompositingContext {
  assetId: string;
  presetType: PresetType;
  sourcePath: string;
  outputPath: string;
  creatorName: string;
  videoTitle?: string;
  videoPrice?: number;
  category?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function validPreset(p: string): p is PresetType {
  return ['poster', 'digital_ticket', 'flyer'].includes(p);
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── SVG Generators ──────────────────────────────────────────────

function svgPoster(ctx: CompositingContext): Buffer {
  const W = 1080, H = 1920;
  const name = truncate(escXml(ctx.creatorName), 28);
  const title = ctx.videoTitle ? truncate(escXml(ctx.videoTitle), 36) : '';
  const price = ctx.videoPrice && ctx.videoPrice > 0 ? `KES ${Math.round(ctx.videoPrice)}` : '';

  // Bottom gradient overlay (400px from bottom, dark → transparent)
  const gradientSvg = `<svg width="${W}" height="${H}"><defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.75)"/>
    </linearGradient>
  </defs><rect x="0" y="${H - 500}" width="${W}" height="500" fill="url(#g)"/></svg>`;

  // Text overlay
  let textY = H - 80;
  let textSvg = `<svg width="${W}" height="${H}">`;

  // Creator name — bottom-left, 30px from edges
  textSvg += `<text x="40" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="white">${name}</text>`;
  textY -= 60;

  // Video title if present
  if (title) {
    textSvg += `<text x="40" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" fill="rgba(255,255,255,0.85)">${title}</text>`;
    textY -= 50;
  }

  // Price badge
  if (price) {
    const badgeX = 40, badgeY = textY - 10;
    textSvg += `<rect x="${badgeX}" y="${badgeY - 36}" width="${price.length * 16 + 32}" height="44" rx="22" fill="#10b981"/>`;
    textSvg += `<text x="${badgeX + 16}" y="${badgeY - 6}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="white">${escXml(price)}</text>`;
  }

  // AfriSpine logo — top-right, small, semi-transparent
  textSvg += `<text x="${W - 40}" y="50" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="rgba(255,255,255,0.5)" text-anchor="end">AfriSpine</text>`;

  // Filmstrip accent line at top
  textSvg += `<rect x="0" y="0" width="${W}" height="4" fill="#10b981"/>`;

  textSvg += '</svg>';

  return Buffer.from(textSvg);
}

function svgTicket(ctx: CompositingContext): Buffer {
  const W = 1080, H = 1920;
  const name = truncate(escXml(ctx.creatorName), 24);
  const title = ctx.videoTitle ? truncate(escXml(ctx.videoTitle), 30) : 'Live Show';
  const price = ctx.videoPrice && ctx.videoPrice > 0 ? `KES ${Math.round(ctx.videoPrice)}` : 'FREE ENTRY';
  const date = formatDate();

  // Full template as one SVG
  const svg = `<svg width="${W}" height="${H}">
    <!-- Background gradient -->
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a0a0a"/>
        <stop offset="100%" stop-color="#1a1a2e"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#14b8a6"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Emerald accent stripe -->
    <rect x="0" y="0" width="${W}" height="6" fill="url(#accent)"/>
    <rect x="0" y="${H - 6}" width="${W}" height="6" fill="url(#accent)"/>

    <!-- QR-like decorative border -->
    <rect x="50" y="120" width="${W - 100}" height="${H - 240}" rx="20" fill="none" stroke="#10b981" stroke-width="2" opacity="0.4"/>
    <rect x="60" y="130" width="${W - 120}" height="${H - 260}" rx="16" fill="none" stroke="#10b981" stroke-width="1" opacity="0.2"/>

    <!-- Corner marks -->
    <line x1="50" y1="140" x2="100" y2="140" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="50" y1="140" x2="50" y2="190" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="${W - 50}" y1="140" x2="${W - 100}" y2="140" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="${W - 50}" y1="140" x2="${W - 50}" y2="190" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="50" y1="${H - 140}" x2="100" y2="${H - 140}" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="50" y1="${H - 140}" x2="50" y2="${H - 190}" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="${W - 50}" y1="${H - 140}" x2="${W - 100}" y2="${H - 140}" stroke="#10b981" stroke-width="3" opacity="0.6"/>
    <line x1="${W - 50}" y1="${H - 140}" x2="${W - 50}" y2="${H - 190}" stroke="#10b981" stroke-width="3" opacity="0.6"/>

    <!-- ADMIT ONE header -->
    <text x="${W / 2}" y="300" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="#10b981" text-anchor="middle" letter-spacing="12">ADMIT ONE</text>

    <!-- Divider line -->
    <line x1="200" y1="340" x2="${W - 200}" y2="340" stroke="#10b981" stroke-width="1" opacity="0.4"/>

    <!-- Show title -->
    <text x="${W / 2}" y="460" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">${escXml(title)}</text>

    <!-- Creator name -->
    <text x="${W / 2}" y="540" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="500" fill="rgba(255,255,255,0.7)" text-anchor="middle">by ${name}</text>

    <!-- Dashed separator -->
    <line x1="80" y1="650" x2="${W - 80}" y2="650" stroke="#333" stroke-width="1" stroke-dasharray="8,6"/>

    <!-- Date -->
    <text x="${W / 2}" y="740" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="rgba(255,255,255,0.6)" text-anchor="middle">${escXml(date)}</text>

    <!-- Price badge -->
    <rect x="${W / 2 - 100}" y="800" width="200" height="56" rx="28" fill="#10b981"/>
    <text x="${W / 2}" y="836" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">${escXml(price)}</text>

    <!-- AfriSpine branding -->
    <text x="${W / 2}" y="${H - 80}" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="rgba(255,255,255,0.3)" text-anchor="middle" letter-spacing="4">AFRISPINE</text>

    <!-- Small decorative QR-like grid -->
    <rect x="${W / 2 - 60}" y="920" width="120" height="120" rx="8" fill="rgba(16,185,129,0.1)" stroke="#10b981" stroke-width="1" opacity="0.3"/>
    <rect x="${W / 2 - 40}" y="940" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 - 16}" y="940" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 + 24}" y="940" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 - 40}" y="964" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 + 8}" y="964" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 + 24}" y="964" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 - 40}" y="988" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 - 16}" y="988" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 + 24}" y="988" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 - 40}" y="1012" width="16" height="16" fill="#10b981" opacity="0.5"/>
    <rect x="${W / 2 + 8}" y="1012" width="16" height="16" fill="#10b981" opacity="0.5"/>
  </svg>`;

  return Buffer.from(svg);
}

function svgFlyer(ctx: CompositingContext): Buffer {
  const W = 1080, H = 1350;
  const name = truncate(escXml(ctx.creatorName), 28);
  const title = ctx.videoTitle ? truncate(escXml(ctx.videoTitle), 32) : 'New Content';
  const category = ctx.category ? escXml(ctx.category.toUpperCase()) : '';
  const price = ctx.videoPrice && ctx.videoPrice > 0 ? `KES ${Math.round(ctx.videoPrice)}` : '';

  const svg = `<svg width="${W}" height="${H}">
    <!-- Bright gradient background -->
    <defs>
      <linearGradient id="flyBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#059669"/>
        <stop offset="50%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#14b8a6"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#flyBg)"/>

    <!-- Subtle pattern overlay -->
    <circle cx="${W - 120}" cy="150" r="300" fill="rgba(255,255,255,0.05)"/>
    <circle cx="150" cy="${H - 200}" r="250" fill="rgba(255,255,255,0.05)"/>

    <!-- Category badge -->
    ${category ? `<rect x="${W / 2 - 80}" y="180" width="160" height="40" rx="20" fill="rgba(255,255,255,0.2)"/>
    <text x="${W / 2}" y="206" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="white" text-anchor="middle" letter-spacing="3">${category}</text>` : ''}

    <!-- Title -->
    <text x="${W / 2}" y="340" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">${escXml(title)}</text>

    <!-- Creator name -->
    <text x="${W / 2}" y="420" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="500" fill="rgba(255,255,255,0.85)" text-anchor="middle">${name}</text>

    <!-- Price badge -->
    ${price ? `<rect x="${W / 2 - 90}" y="500" width="180" height="50" rx="25" fill="rgba(0,0,0,0.3)"/>
    <text x="${W / 2}" y="532" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">${escXml(price)}</text>` : ''}

    <!-- Decorative line -->
    <line x1="200" y1="620" x2="${W - 200}" y2="620" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

    <!-- AfriSpine branding -->
    <text x="${W / 2}" y="${H - 80}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="rgba(255,255,255,0.5)" text-anchor="middle" letter-spacing="2">Watch on AfriSpine</text>

    <!-- Small emerald bar -->
    <rect x="0" y="${H - 6}" width="${W}" height="6" fill="rgba(0,0,0,0.2)"/>
  </svg>`;

  return Buffer.from(svg);
}

// ── Compositing Pipeline ────────────────────────────────────────

async function runCompositing(ctx: CompositingContext): Promise<void> {
  const isPoster = ctx.presetType === 'poster';
  const outputW = 1080;
  const outputH = isPoster || ctx.presetType === 'digital_ticket' ? 1920 : 1350;

  let pipeline: sharp.Sharp;

  if (isPoster) {
    // Poster: source image as background, text overlays on top
    pipeline = sharp(ctx.sourcePath)
      .resize(outputW, outputH, { fit: 'cover', position: 'center' })
      .composite([
        // Bottom gradient overlay
        {
          input: Buffer.from(
            `<svg width="${outputW}" height="${outputH}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.75)"/></linearGradient></defs><rect x="0" y="${outputH - 500}" width="${outputW}" height="500" fill="url(#g)"/></svg>`
          ),
        },
        // Filmstrip accent at top
        {
          input: Buffer.from(
            `<svg width="${outputW}" height="4"><rect width="${outputW}" height="4" fill="#10b981"/></svg>`
          ),
        },
        // All text overlays
        { input: svgPoster(ctx) },
      ]);
  } else if (ctx.presetType === 'digital_ticket') {
    // Ticket: SVG template as background (source image not used as bg)
    pipeline = sharp(svgTicket(ctx))
      .png();
  } else {
    // Flyer: SVG template as background
    pipeline = sharp(svgFlyer(ctx))
      .png();
  }

  await pipeline.png().toFile(ctx.outputPath);
}

// ── POST: Upload + Compose ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('sourceImage') as File | null;
    const presetType = formData.get('presetType') as string | null;
    const videoId = formData.get('videoId') as string | null;
    const creatorId = formData.get('creatorId') as string | null;

    // Validate
    if (!file || !presetType || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceImage, presetType, creatorId' },
        { status: 400 },
      );
    }
    if (!validPreset(presetType)) {
      return NextResponse.json(
        { error: 'presetType must be poster, digital_ticket, or flyer' },
        { status: 400 },
      );
    }

    // Fetch creator profile for compositing data
    const creator = await db.creatorProfile.findUnique({ where: { id: creatorId } });
    const creatorName = creator?.stageName || creator?.handle || 'Creator';

    // Fetch video data if videoId provided
    let videoTitle: string | undefined;
    let videoPrice: number | undefined;
    let category: string | undefined;
    if (videoId) {
      const video = await db.video.findUnique({ where: { id: videoId } });
      if (video) {
        videoTitle = video.title;
        videoPrice = video.ticketPriceKes;
        category = video.category;
      }
    } else if (creator) {
      category = creator.category || undefined;
    }

    // Generate asset ID and save source file
    const assetId = `ca_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ext = extFromMime(file.type || 'image/jpeg');
    const sourcePath = join(ASSET_DIR, `${assetId}.${ext}`);
    const outputPath = join(ASSET_DIR, `${assetId}_${presetType}.png`);
    const sourceAssetUrl = `/creative-assets/${assetId}.${ext}`;
    const generatedUrl = `/creative-assets/${assetId}_${presetType}.png`;

    // Write source file
    const bytes = await file.arrayBuffer();
    await new Promise<void>((resolve, reject) => {
      writeFile(sourcePath, Buffer.from(bytes), (err) =>
        err ? reject(err) : resolve(),
      );
    });

    // Create DB record with status='processing'
    const asset = await db.creativeAsset.create({
      data: {
        id: assetId,
        creatorId,
        videoId: videoId || null,
        presetType,
        sourceAssetUrl,
        status: 'processing',
      },
    });

    // Run compositing pipeline
    try {
      await runCompositing({
        assetId,
        presetType: presetType as PresetType,
        sourcePath,
        outputPath,
        creatorName,
        videoTitle,
        videoPrice,
        category,
      });

      // Update record with generated URL + status
      const updated = await db.creativeAsset.update({
        where: { id: assetId },
        data: {
          generatedUrl,
          status: 'pending_approval',
        },
      });

      return NextResponse.json({ asset: updated }, { status: 201 });
    } catch (compErr) {
      console.error('[creative-assets] Compositing failed:', compErr);
      // Keep status as 'processing' so user knows it failed
      return NextResponse.json(
        { asset, error: 'Compositing failed — asset saved but not generated' },
        { status: 201 },
      );
    }
  } catch (err) {
    console.error('[creative-assets] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── GET: List Assets ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { creatorId };
    if (status) {
      where.status = status;
    }

    const assets = await db.creativeAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        video: {
          select: { id: true, title: true, category: true, ticketPriceKes: true },
        },
      },
    });

    return NextResponse.json({ assets });
  } catch (err) {
    console.error('[creative-assets] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── PATCH: Approve / Reject ─────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 },
      );
    }

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'status must be approved or rejected' },
        { status: 400 },
      );
    }

    // Verify the asset exists and is in a patchable state
    const existing = await db.creativeAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 },
      );
    }

    if (existing.status === 'approved' || existing.status === 'rejected') {
      return NextResponse.json(
        { error: `Asset is already ${existing.status}` },
        { status: 400 },
      );
    }

    // If status is 'processing', trigger compositing first
    let finalStatus = status;
    if (existing.status === 'processing' && status === 'approved') {
      // Re-run compositing if it failed the first time
      if (!existing.generatedUrl) {
        try {
          const creator = await db.creatorProfile.findUnique({ where: { id: existing.creatorId } });
          const creatorName = creator?.stageName || creator?.handle || 'Creator';

          let videoTitle: string | undefined;
          let videoPrice: number | undefined;
          let category: string | undefined;
          if (existing.videoId) {
            const video = await db.video.findUnique({ where: { id: existing.videoId } });
            if (video) {
              videoTitle = video.title;
              videoPrice = video.ticketPriceKes;
              category = video.category;
            }
          }

          const sourcePath = existing.sourceAssetUrl
            ? join(process.cwd(), 'public', existing.sourceAssetUrl)
            : '';
          const outputPath = join(ASSET_DIR, `${existing.id}_${existing.presetType}.png`);

          if (sourcePath && existsSync(sourcePath)) {
            await runCompositing({
              assetId: existing.id,
              presetType: existing.presetType as PresetType,
              sourcePath,
              outputPath,
              creatorName,
              videoTitle,
              videoPrice,
              category,
            });

            await db.creativeAsset.update({
              where: { id },
              data: { generatedUrl: `/creative-assets/${existing.id}_${existing.presetType}.png` },
            });
          }
        } catch (compErr) {
          console.error('[creative-assets] Re-compositing failed:', compErr);
          return NextResponse.json(
            { error: 'Compositing failed — cannot approve' },
            { status: 500 },
          );
        }
      }
      // After compositing, set to pending_approval so creator can review
      finalStatus = 'pending_approval';
    }

    const updated = await db.creativeAsset.update({
      where: { id },
      data: { status: finalStatus },
    });

    return NextResponse.json({ asset: updated });
  } catch (err) {
    console.error('[creative-assets] PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
