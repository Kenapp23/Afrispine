'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ImagePlus,
  Check,
  X,
  Share2,
  Loader2,
  Sparkles,
  Ticket,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Types ──────────────────────────────────────────────────── */

interface AssetVideo {
  id: string;
  title: string;
  category: string;
  ticketPriceKes: number;
}

interface CreativeAsset {
  id: string;
  presetType: string;
  sourceAssetUrl: string | null;
  generatedUrl: string | null;
  status: string;
  createdAt: string;
  video: AssetVideo | null;
}

type PresetOption = 'poster' | 'digital_ticket' | 'flyer';

interface CreatorVideo {
  id: string;
  title: string;
  category: string;
}

/* ── Helpers ────────────────────────────────────────────────── */

const PRESET_CONFIG: Record<PresetOption, { label: string; icon: React.ReactNode; desc: string }> = {
  poster: { label: 'Poster', icon: <ImageIcon className='h-4 w-4' />, desc: '1080×1920 — image with text overlay' },
  digital_ticket: { label: 'Digital Ticket', icon: <Ticket className='h-4 w-4' />, desc: '1080×1920 — styled ticket design' },
  flyer: { label: 'Flyer', icon: <FileText className='h-4 w-4' />, desc: '1080×1350 — bright gradient flyer' },
};

function statusBadge(status: string) {
  switch (status) {
    case 'processing':
      return (
        <Badge className='bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-semibold'>
          <Loader2 className='h-3 w-3 mr-1 animate-spin' />
          Processing
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge className='bg-sky-100 text-sky-700 border-sky-200 text-[10px] font-semibold'>
          Pending Review
        </Badge>
      );
    case 'approved':
      return (
        <Badge className='bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-semibold'>
          <Check className='h-3 w-3 mr-1' />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className='bg-red-100 text-red-700 border-red-200 text-[10px] font-semibold'>
          <X className='h-3 w-3 mr-1' />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant='outline' className='text-[10px]'>{status}</Badge>;
  }
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/* ── Component ──────────────────────────────────────────────── */

export function CreativeAssetsSection({ creatorId }: { creatorId: string }) {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetType, setPresetType] = useState<PresetOption>('poster');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    if (!creatorId) return;
    try {
      const res = await fetch(
        `/api/creator/creative-assets?creatorId=${encodeURIComponent(creatorId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Fetch creator's videos for the dropdown
  useEffect(() => {
    if (!creatorId) return;
    (async () => {
      try {
        // Use the video list endpoint — the dashboard already has demo videos,
        // but for real data we query the API
        const res = await fetch(
          `/api/creator/videos?creatorId=${encodeURIComponent(creatorId)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.videos)) {
            setVideos(data.videos.map((v: { id: string; title: string; category: string }) => ({
              id: v.id,
              title: v.title,
              category: v.category,
            })));
          }
        }
      } catch {
        // Videos list may not exist yet — that's fine
      }
    })();
  }, [creatorId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setSelectedFile(file);
    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Generate asset
  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error('Please select a source image');
      return;
    }
    if (!creatorId) return;

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('sourceImage', selectedFile);
      formData.append('presetType', presetType);
      formData.append('creatorId', creatorId);
      if (selectedVideoId) {
        formData.append('videoId', selectedVideoId);
      }

      const res = await fetch('/api/creator/creative-assets', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Asset generated successfully!');
        // Reset form
        setSelectedFile(null);
        setPreviewSrc(null);
        setSelectedVideoId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setDialogOpen(false);
        fetchAssets();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to generate asset');
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  };

  // Approve / Reject
  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/creator/creative-assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success(`Asset ${status}`);
        fetchAssets();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || `Failed to ${status}`);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  // Share
  const handleShare = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(
      () => toast.success('Link copied to clipboard!'),
      () => toast.error('Failed to copy'),
    );
  };

  if (!creatorId) return null;

  return (
    <Card className='border-gray-100'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-base flex items-center gap-2'>
          <Sparkles className='h-5 w-5 text-emerald-600' />
          Creative Assets
          <Badge className='bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-semibold'>
            {assets.length}
          </Badge>
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size='sm'
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <ImagePlus className='h-4 w-4 mr-1.5' />
              Generate New
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5 text-emerald-600' />
                Generate Creative Asset
              </DialogTitle>
            </DialogHeader>

            <div className='space-y-4 mt-2'>
              {/* Image Upload */}
              <div className='space-y-2'>
                <Label>Source Image</Label>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer'
                />
                {previewSrc && (
                  <div className='mt-2 rounded-lg overflow-hidden border border-gray-200 max-h-48'>
                    <img
                      src={previewSrc}
                      alt='Preview'
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
              </div>

              {/* Preset Type */}
              <div className='space-y-2'>
                <Label>Preset Type</Label>
                <Select value={presetType} onValueChange={(v) => setPresetType(v as PresetOption)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRESET_CONFIG) as [PresetOption, typeof PRESET_CONFIG[PresetOption]][]).map(
                      ([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <div className='flex items-center gap-2'>
                            {cfg.icon}
                            <div>
                              <div className='font-semibold'>{cfg.label}</div>
                              <div className='text-[10px] text-gray-400'>{cfg.desc}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Video Selector */}
              <div className='space-y-2'>
                <Label className='text-gray-500'>Video (optional)</Label>
                <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a video...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__none__'>None (generic asset)</SelectItem>
                    {videos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.title}
                        <span className='text-[10px] text-gray-400 ml-1'>{v.category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedFile}
                className='w-full bg-emerald-600 hover:bg-emerald-700 text-white'
              >
                {generating ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className='h-4 w-4 mr-2' />
                    Generate {PRESET_CONFIG[presetType].label}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className='p-0'>
        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='h-5 w-5 animate-spin text-emerald-400' />
          </div>
        ) : assets.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
            <ImageIcon className='h-8 w-8 mb-2' />
            <p className='text-sm'>No creative assets yet</p>
            <p className='text-xs mt-1'>Generate posters, tickets, and flyers for your content</p>
          </div>
        ) : (
          <div className='max-h-96 overflow-y-auto p-4 pt-0'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className='rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-md transition-shadow'
                >
                  {/* Thumbnail */}
                  <div className='relative aspect-[9/12] bg-gray-50'>
                    {asset.generatedUrl ? (
                      <img
                        src={asset.generatedUrl}
                        alt={`${asset.presetType} asset`}
                        className='w-full h-full object-cover'
                      />
                    ) : asset.status === 'processing' ? (
                      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2'>
                        <Loader2 className='h-8 w-8 animate-spin text-emerald-400' />
                        <span className='text-xs text-gray-400'>Compositing...</span>
                      </div>
                    ) : (
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <ImageIcon className='h-8 w-8 text-gray-300' />
                      </div>
                    )}
                    {/* Status badge overlay */}
                    <div className='absolute top-2 right-2'>
                      {statusBadge(asset.status)}
                    </div>
                    {/* Preset type badge */}
                    <div className='absolute top-2 left-2'>
                      <Badge
                        variant='outline'
                        className='bg-white/90 backdrop-blur-sm text-[10px] font-semibold border-gray-200'
                      >
                        {PRESET_CONFIG[asset.presetType as PresetOption]?.label || asset.presetType}
                      </Badge>
                    </div>
                  </div>

                  {/* Info + actions */}
                  <div className='p-3 space-y-2'>
                    {/* Video title if linked */}
                    {asset.video && (
                      <p className='text-xs text-gray-500 truncate font-medium'>
                        {asset.video.title}
                      </p>
                    )}
                    <p className='text-[10px] text-gray-400'>{timeAgo(asset.createdAt)}</p>

                    {/* Action buttons */}
                    <div className='flex items-center gap-2'>
                      {asset.status === 'pending_approval' && (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            className='flex-1 h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            disabled={actionLoading === asset.id}
                            onClick={() => handleStatus(asset.id, 'approved')}
                          >
                            {actionLoading === asset.id ? (
                              <Loader2 className='h-3 w-3 animate-spin' />
                            ) : (
                              <Check className='h-3 w-3 mr-1' />
                            )}
                            Approve
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='flex-1 h-8 text-xs border-red-200 text-red-600 hover:bg-red-50'
                            disabled={actionLoading === asset.id}
                            onClick={() => handleStatus(asset.id, 'rejected')}
                          >
                            <X className='h-3 w-3 mr-1' />
                            Reject
                          </Button>
                        </>
                      )}
                      {asset.status === 'processing' && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full h-8 text-xs'
                          disabled
                        >
                          <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                          Processing
                        </Button>
                      )}
                      {asset.status === 'approved' && asset.generatedUrl && (
                        <Button
                          size='sm'
                          className='flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white'
                          onClick={() => handleShare(asset.generatedUrl!)}
                        >
                          <Share2 className='h-3 w-3 mr-1' />
                          Share
                        </Button>
                      )}
                      {asset.status === 'rejected' && (
                        <span className='text-[10px] text-gray-400 italic'>Rejected</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
