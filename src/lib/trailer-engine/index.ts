/**
 * AI Trailer Generation Engine
 *
 * Pipeline:
 * 1. Download the full video from Cloudflare Stream
 * 2. Analyze audio energy to find highlight segments
 * 3. Extract & stitch segments with crossfades
 * 4. Apply loudness normalization + optional upscale
 * 5. Add branded intro/outro flash
 * 6. Upload trailer back to Cloudflare Stream
 *
 * Uses ffmpeg (available at /usr/bin/ffmpeg) for all video processing.
 * Designed to run in a background context (not request-response).
 */

import { mkdtemp, rm, writeFile, readFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

// ─── Types ───────────────────────────────────────────────
interface Segment {
  start: number;  // seconds
  end: number;    // seconds
  energy: number; // RMS value (0-1)
}

export interface TrailerResult {
  previewStreamId: string | null;
  error?: string;
}

// ─── Main entry point ─────────────────────────────────────
export async function generateTrailer(
  videoId: string,
  cfPremiumStreamId: string,
  cfAccountId: string,
  cfApiToken: string,
): Promise<string | null> {
  const workDir = await mkdtemp(join(tmpdir(), 'afrispine-trailer-'));
  try {
    // 1. Download full video from Cloudflare Stream
    const sourcePath = join(workDir, 'source.mp4');
    await downloadFromCloudflare(cfAccountId, cfApiToken, cfPremiumStreamId, sourcePath);

    // 2. Analyze audio energy
    const segments = await findHighlightSegments(sourcePath);
    if (segments.length === 0) {
      console.warn(`[trailer-engine] No audio energy found for ${videoId}, falling back to time-based segments`);
      segments.push(...generateFallbackSegments(sourcePath));
    }

    // 3. Stitch segments with crossfades
    const rawTrailerPath = join(workDir, 'raw-trailer.mp4');
    await stitchSegments(sourcePath, segments, rawTrailerPath);

    // 4. Quality pass: loudness normalization, optional upscale, branded flash
    const finalPath = join(workDir, 'final-trailer.mp4');
    await qualityPass(rawTrailerPath, finalPath);

    // 5. Upload to Cloudflare Stream
    const previewStreamId = await uploadToCloudflare(cfAccountId, cfApiToken, finalPath);
    return previewStreamId;
  } catch (err: any) {
    console.error(`[trailer-engine] Error generating trailer for ${videoId}:`, err);
    return null;
  } finally {
    // Cleanup temp files
    try { await rm(workDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── Step 1: Download from Cloudflare Stream ──────────────
async function downloadFromCloudflare(
  cfAccountId: string,
  cfApiToken: string,
  streamId: string,
  outputPath: string,
): Promise<void> {
  const url = `https://customer-${cfAccountId}.cloudflarestream.com/${streamId}/downloads/default.mp4`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${cfApiToken}` },
  });
  if (!res.ok) throw new Error(`Failed to download video: ${res.status} ${await res.text()}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outputPath, buffer);
}

// ─── Step 2: Audio energy analysis ────────────────────────
async function findHighlightSegments(sourcePath: string): Promise<Segment[]> {
  // Use ffmpeg's volumedetect + ebur128 to get loudness data
  // Then use ffmpeg's astats to get per-frame RMS energy
  const energyPath = sourcePath + '.energy.txt';
  
  try {
    await runFfmpeg([
      '-i', sourcePath,
      '-af', 'astats=metadata=1:reset=0,ametadata=print:key=lavfi.astats.Overall.RMS_level',
      '-f', 'null', '-'
    ], { timeoutMs: 30000 });
  } catch {
    // Fallback: get duration and split into even segments
  }

  // Get video duration
  const duration = await getDuration(sourcePath);
  if (!duration || duration < 5) return [];

  // Use a simpler approach: extract audio as raw PCM, analyze RMS in chunks
  // For v1, we'll use ffmpeg's silencedetect + volumedetect
  // and pick segments with highest activity
  const analysisPath = sourcePath + '.analysis.txt';
  
  try {
    // Get overall loudness stats
    await runFfmpeg([
      '-i', sourcePath,
      '-af', 'loudnorm=print_format=json:linear=true:i=-16:tp=-1.5:lra=11',
      '-f', 'null', '-'
    ], { timeoutMs: 60000, captureStderr: true });
  } catch {
    // Continue with time-based segments
  }

  // v1 simple heuristic: divide video into N-second windows, pick the loudest ones
  const windowSize = Math.min(5, Math.max(3, duration / 6)); // 3-5 second windows
  const numWindows = Math.floor(duration / windowSize);
  if (numWindows < 2) {
    // Video too short, just use the whole thing truncated to 20s
    return [{ start: 0, end: Math.min(duration, 20), energy: 1 }];
  }

  // Analyze RMS energy per window using ffmpeg
  const windowEnergies: { start: number; end: number; rms: number }[] = [];
  
  for (let i = 0; i < numWindows; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, duration);
    try {
      const { stderr } = await runFfmpeg([
        '-ss', start.toString(),
        '-t', (end - start).toString(),
        '-i', sourcePath,
        '-af', 'astats=metadata=1:reset=1',
        '-f', 'null', '-'
      ], { timeoutMs: 10000, captureStderr: true });
      
      // Parse RMS from stderr
      const rmsMatch = stderr.match(/RMS_level dB[\s\S]*?mean:\s*([\-\d.]+)/);
      const rms = rmsMatch ? parseFloat(rmsMatch[1]) : -60;
      // Convert from dB to linear (0-1 range)
      const linearRms = Math.pow(10, rms / 20);
      windowEnergies.push({ start, end, rms: linearRms });
    } catch {
      windowEnergies.push({ start, end, rms: 0.01 });
    }
  }

  // Sort by energy (descending) and pick top 2-4 non-overlapping segments
  windowEnergies.sort((a, b) => b.rms - a.rms);
  
  const selected: Segment[] = [];
  let totalDuration = 0;
  const targetDuration = Math.min(20, Math.max(15, duration * 0.15)); // 15-20s or 15% of video
  const minSegmentDuration = 2;

  for (const w of windowEnergies) {
    if (totalDuration >= targetDuration) break;
    if (selected.length >= 4) break;
    
    // Check overlap with already selected
    const overlaps = selected.some(s => 
      (w.start < s.end + 1 && w.end > s.start - 1)
    );
    if (overlaps) continue;
    
    const segDuration = Math.min(w.end - w.start, targetDuration - totalDuration);
    if (segDuration >= minSegmentDuration) {
      selected.push({
        start: w.start,
        end: w.start + segDuration,
        energy: w.rms,
      });
      totalDuration += segDuration;
    }
  }

  return selected;
}

function generateFallbackSegments(sourcePath: string): Segment[] {
  // Evenly spaced segments — used when audio analysis fails
  return [
    { start: 0, end: 5, energy: 0.5 },
    { start: 10, end: 15, energy: 0.5 },
    { start: 25, end: 30, energy: 0.5 },
  ];
}

// ─── Step 3: Stitch segments with crossfade ────────────────
async function stitchSegments(
  sourcePath: string,
  segments: Segment[],
  outputPath: string,
): Promise<void> {
  if (segments.length === 0) throw new Error('No segments to stitch');
  
  if (segments.length === 1) {
    // Single segment — just trim
    await runFfmpeg([
      '-i', sourcePath,
      '-ss', segments[0].start.toString(),
      '-t', (segments[0].end - segments[0].start).toString(),
      '-c', 'copy',
      outputPath,
    ], { timeoutMs: 60000 });
    return;
  }

  // Multiple segments — use xfade filter for crossfades
  // For reliability with many segments, concatenate with short crossfades
  const crossfadeDur = 0.5; // 0.5s crossfade
  
  // Extract each segment to a temp file
  const segFiles: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segPath = `${sourcePath}.seg${i}.mp4`;
    await runFfmpeg([
      '-i', sourcePath,
      '-ss', segments[i].start.toString(),
      '-t', (segments[i].end - segments[i].start).toString(),
      '-c:v', 'libx264', '-preset', 'ultrafast',
      '-c:a', 'aac', '-ar', '44100', '-ac', '2',
      '-r', '30',
      segPath,
    ], { timeoutMs: 60000 });
    segFiles.push(segPath);
  }

  if (segFiles.length === 1) {
    await runFfmpeg(['-i', segFiles[0], '-c', 'copy', outputPath], { timeoutMs: 60000 });
  } else if (segFiles.length === 2) {
    // Two segments — simple xfade
    await runFfmpeg([
      '-i', segFiles[0],
      '-i', segFiles[1],
      '-filter_complex', `
        [0:v][1:v]xfade=transition=fade:duration=${crossfadeDur}:offset=${getDurationOf(segFiles[0]) - crossfadeDur}[v];
        [0:a][1:a]acrossfade=d=${crossfadeDur}[a]
      `,
      '-map', '[v]', '-map', '[a]',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-ar', '44100',
      outputPath,
    ], { timeoutMs: 120000 });
  } else {
    // 3+ segments — concatenate with xfade chain
    // Build xfade filter chain incrementally
    // For simplicity and reliability, use concat demuxer (no crossfade but fast)
    const concatListPath = `${sourcePath}.concat.txt`;
    const concatContent = segFiles.map(f => `file '${f}'`).join('\n');
    await writeFile(concatListPath, concatContent);
    
    await runFfmpeg([
      '-f', 'concat', '-safe', '0',
      '-i', concatListPath,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-ar', '44100', '-ac', '2',
      '-r', '30',
      outputPath,
    ], { timeoutMs: 120000 });
    
    // Cleanup concat list
    try { await unlink(concatListPath); } catch {}
  }

  // Cleanup segment files
  for (const f of segFiles) {
    try { await unlink(f); } catch {}
  }
}

// ─── Step 4: Quality pass ──────────────────────────────────
async function qualityPass(inputPath: string, outputPath: string): Promise<void> {
  // 1. Loudness normalization to -14 LUFS (standard for social/streaming)
  // 2. Light dynamic range compression
  // 3. Conditional upscale if below 720p
  // 4. Branded intro/outro flash (0.5s emerald overlay with "AfriSpine" text)
  
  // For v1: loudness normalization + ensure 720p minimum + consistent codec
  await runFfmpeg([
    '-i', inputPath,
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json',
    '-vf', 'scale=\'min(1280,iw)\':min(\'720,ih\'):force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    '-movflags', '+faststart',
    '-r', '30',
    '-y',
    outputPath,
  ], { timeoutMs: 120000 });
}

// ─── Step 5: Upload to Cloudflare Stream ──────────────────
async function uploadToCloudflare(
  cfAccountId: string,
  cfApiToken: string,
  filePath: string,
): Promise<string | null> {
  try {
    // Get a direct upload URL
    const uploadRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfApiToken}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '0',
          'Upload-Metadata': `filename afrispine-trailer-${Date.now()}.mp4`,
        },
      },
    );

    if (!uploadRes.ok) {
      console.error('[trailer-engine] Failed to get upload URL:', await uploadRes.text());
      return null;
    }

    const uploadData = await uploadRes.json();
    const uploadUrl = uploadData.result?.uploadURL || uploadData.uploadURL;
    const uid = uploadData.result?.uid || uploadData.uid;

    if (!uploadUrl || !uid) {
      console.error('[trailer-engine] Invalid upload response:', JSON.stringify(uploadData));
      return null;
    }

    // Upload the file via TUS protocol
    const fileBuffer = await readFile(filePath);
    const fileSize = fileBuffer.length;

    // Create upload
    await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Upload-Length': fileSize.toString(),
        'Upload-Metadata': `filename afrispine-trailer-${Date.now()}.mp4`,
        'Tus-Resumable': '1.0.0',
        'Content-Type': 'application/offset+octet-stream',
      },
    });

    // Upload the file in one shot (for trailers under ~100MB this is fine)
 const patchRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Upload-Offset': '0',
        'Content-Type': 'application/offset+octet-stream',
        'Tus-Resumable': '1.0.0',
      },
      body: fileBuffer,
    });

    if (!patchRes.ok) {
      console.error('[trailer-engine] Upload PATCH failed:', patchRes.status, await patchRes.text());
      return null;
    }

    // Poll for ready status
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const statusRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/${uid}`,
          { headers: { Authorization: `Bearer ${cfApiToken}` } },
        );
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const state = statusData.result?.status?.state;
          if (state === 'ready') return uid;
          if (state === 'failed') {
            console.error('[trailer-engine] Cloudflare processing failed for trailer');
            return null;
          }
        }
      } catch {}
    }

    console.error('[trailer-engine] Timed out waiting for trailer processing');
    return null;
  } catch (err) {
    console.error('[trailer-engine] Upload error:', err);
    return null;
  }
}

// ─── Helpers ───────────────────────────────────────────────
async function getDuration(filePath: string): Promise<number | null> {
  try {
    const { stderr } = await runFfmpeg(['-i', filePath], { timeoutMs: 10000, captureStderr: true });
    const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const s = parseInt(match[3]);
      const ms = parseInt(match[4]);
      return h * 3600 + m * 60 + s + ms / 100;
    }
  } catch {}
  return null;
}

async function getDurationOf(filePath: string): Promise<number> {
  const d = await getDuration(filePath);
  return d || 5;
}

interface FfmpegOptions {
  timeoutMs?: number;
  captureStderr?: boolean;
}

function runFfmpeg(
  args: string[],
  options: FfmpegOptions = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const timeout = options.timeoutMs || 30000;
    const proc = spawn('ffmpeg', args.map(a => a.replace(/\\'/g, "'")));
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('ffmpeg timed out'));
    }, timeout);
    proc.on('close', (code: number) => {
      clearTimeout(timer);
      if (code === 0 || code === null) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });
    proc.on('error', (err: Error) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
