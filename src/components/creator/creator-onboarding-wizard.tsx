'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Music,
  Laugh,
  Film,
  Users,
  Camera,
  Mic,
  Radio,
  Shirt,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  X,
  Copy,
  Share2,
  Sparkles,
  Upload,
  MapPin,
  Languages,
  MessageSquare,
  Banknote,
  Eye,
  Link2,
  PartyPopper,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app';

// ─── Types ──────────────────────────────────────────────────────

interface CreatorOnboardingWizardProps {
  creatorId?: string;
}

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface WizardData {
  category: string;
  avatarUrl: string;
  stageName: string;
  handle: string;
  location: string;
  languages: string;
  bio: string;
  services: string[];
  mpesaPayoutNumber: string;
}

interface ProfileData {
  stageName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string;
  category?: string;
  location?: string;
  languages?: string;
  mpesaPayoutNumber?: string;
  onboardingStep?: number;
  profilePublished?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'comedy', label: 'Comedy', icon: Laugh },
  { id: 'film', label: 'Film', icon: Film },
  { id: 'dance', label: 'Dance', icon: Users },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'mc_host', label: 'MC / Host', icon: Mic },
  { id: 'podcast', label: 'Podcast', icon: Radio },
  { id: 'fashion', label: 'Fashion', icon: Shirt },
  { id: 'sports', label: 'Sports', icon: Trophy },
] as const;

const SERVICES = [
  'Live Performance',
  'Studio Recording',
  'Event Hosting',
  'Voiceover',
  'Content Creation',
  'Photography',
  'Video Production',
  'DJ Sets',
  'Choreography',
  'Speaking',
] as const;

const STEP_TITLES = [
  '',
  'Choose Your Category',
  'Add Your Photo',
  'Stage Name & Handle',
  'Location & Languages',
  'Tell Us About Yourself',
  'Your Services',
  'Sample Content',
  'Payout Details',
  'Publish Your Profile',
  'Share With the World',
] as const;

const TOTAL_STEPS = 10;

// ─── Confetti CSS ───────────────────────────────────────────────

const confettiStyles = `
@keyframes confetti-fall-4a {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
.confetti-piece-4a {
  position: fixed;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall-4a linear forwards;
  pointer-events: none;
  z-index: 9999;
}
`;

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 3}s`,
      size: 6 + Math.floor(Math.random() * 8),
    }));
  }, []);

  return (
    <>
      <style>{confettiStyles}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece-4a"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </>
  );
}

// ─── Slide variants ─────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ─── Main Component ─────────────────────────────────────────────

export function CreatorOnboardingWizard({ creatorId }: CreatorOnboardingWizardProps) {
  const navigate = useAppStore((s) => s.navigate);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [published, setPublished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Form data
  const [data, setData] = useState<WizardData>({
    category: '',
    avatarUrl: '',
    stageName: '',
    handle: '',
    location: '',
    languages: '',
    bio: '',
    services: [],
    mpesaPayoutNumber: '',
  });

  // Handle availability
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle');
  const handleCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch existing profile on mount ─────────────────────────

  useEffect(() => {
    if (!creatorId) {
      setInitialLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/creator/profile?id=${creatorId}`);
        if (res.ok) {
          const profile = await res.json();
          setProfileData(profile);

          // Pre-fill completed steps
          if (profile.category) setData((d) => ({ ...d, category: profile.category }));
          if (profile.avatarUrl) setData((d) => ({ ...d, avatarUrl: profile.avatarUrl }));
          if (profile.stageName) setData((d) => ({ ...d, stageName: profile.stageName }));
          if (profile.handle) setData((d) => ({ ...d, handle: profile.handle }));
          if (profile.location) setData((d) => ({ ...d, location: profile.location }));
          if (profile.languages) setData((d) => ({ ...d, languages: profile.languages }));
          if (profile.bio) setData((d) => ({ ...d, bio: profile.bio }));
          if (profile.mpesaPayoutNumber) setData((d) => ({ ...d, mpesaPayoutNumber: profile.mpesaPayoutNumber }));

          // Restore step (if already published, jump to share)
          if (profile.profilePublished) {
            setStep(10);
            setPublished(true);
          } else if (profile.onboardingStep && profile.onboardingStep > 1) {
            setStep(Math.min(profile.onboardingStep + 1, 10));
          }
        }
      } catch {
        // Silently fail — user can start fresh
      } finally {
        setInitialLoading(false);
      }
    }

    fetchProfile();
  }, [creatorId]);

  // ─── Debounced handle check ──────────────────────────────────

  const checkHandle = useCallback(async (handle: string) => {
    if (!handle || handle.length < 3) {
      setHandleStatus('idle');
      return;
    }
    const valid = /^[a-z0-9_]{3,30}$/.test(handle);
    if (!valid) {
      setHandleStatus('invalid');
      return;
    }

    setHandleStatus('checking');
    try {
      const res = await fetch(`/api/creator/check-handle?handle=${encodeURIComponent(handle)}`);
      const result = await res.json();
      setHandleStatus(result.available ? 'available' : 'taken');
    } catch {
      setHandleStatus('idle');
    }
  }, []);

  const onHandleChange = useCallback(
    (val: string) => {
      const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      setData((d) => ({ ...d, handle: cleaned }));

      if (handleCheckRef.current) clearTimeout(handleCheckRef.current);
      handleCheckRef.current = setTimeout(() => checkHandle(cleaned), 500);
    },
    [checkHandle]
  );

  // ─── Save step to API ────────────────────────────────────────

  const saveStep = useCallback(
    async (stepNum: number, payload: Record<string, unknown>) => {
      if (!creatorId) return false;
      try {
        const res = await fetch('/api/creator/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: stepNum, data: payload, creatorId }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [creatorId]
  );

  // ─── Fire analytics ──────────────────────────────────────────

  const fireAnalytics = useCallback((eventName: string, meta?: Record<string, unknown>) => {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, ...meta }),
    }).catch(() => {});
  }, []);

  // ─── Validation ──────────────────────────────────────────────

  const validate = useCallback(
    (s: number): boolean => {
      switch (s) {
        case 1:
          if (!data.category.trim()) {
            toast.error('Please select a category');
            return false;
          }
          return true;
        case 2:
          return true; // Optional
        case 3:
          if (!data.stageName.trim()) {
            toast.error('Please enter your stage name');
            return false;
          }
          if (!data.handle.trim()) {
            toast.error('Please choose a handle');
            return false;
          }
          if (!/^[a-z0-9_]{3,30}$/.test(data.handle)) {
            toast.error('Handle must be 3-30 characters (lowercase, numbers, underscores)');
            return false;
          }
          if (handleStatus !== 'available') {
            toast.error(handleStatus === 'taken' ? 'This handle is already taken' : 'Please wait for handle check to complete');
            return false;
          }
          return true;
        case 4:
          if (!data.location.trim()) {
            toast.error('Please enter your location');
            return false;
          }
          return true;
        case 5:
          if (!data.bio.trim()) {
            toast.error('Please write a bio');
            return false;
          }
          return true;
        case 6:
          return true; // Optional
        case 7:
          return true; // No-op
        case 8:
          if (data.mpesaPayoutNumber.replace(/\D/g, '').length < 10) {
            toast.error('Please enter a valid phone number (at least 10 digits)');
            return false;
          }
          return true;
        default:
          return true;
      }
    },
    [data, handleStatus]
  );

  // ─── Navigation ─────────────────────────────────────────────

  const goNext = useCallback(async () => {
    if (step === 9) {
      // Publish step
      if (!validate(9)) return;
      setLoading(true);
      const ok = await saveStep(9, {});
      setLoading(false);
      if (ok) {
        setPublished(true);
        setShowConfetti(true);
        fireAnalytics('profile_published', { creatorId });
        setDirection(1);
        setStep(10);
        setTimeout(() => setShowConfetti(false), 5000);
      } else {
        toast.error('Failed to publish. Please try again.');
      }
      return;
    }

    if (!validate(step)) return;

    // Save current step data before advancing
    setLoading(true);
    let payload: Record<string, unknown> = {};
    switch (step) {
      case 1: payload = { category: data.category }; break;
      case 2: payload = { avatarUrl: data.avatarUrl }; break;
      case 3: payload = { stageName: data.stageName, handle: data.handle }; break;
      case 4: payload = { location: data.location, languages: data.languages }; break;
      case 5: payload = { bio: data.bio }; break;
      case 6: payload = { services: data.services }; break;
      case 8: payload = { mpesaPayoutNumber: data.mpesaPayoutNumber }; break;
    }
    if (Object.keys(payload).length > 0) {
      await saveStep(step, payload);
    }
    setLoading(false);

    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [step, data, validate, saveStep]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const toggleService = useCallback((service: string) => {
    setData((d) => ({
      ...d,
      services: d.services.includes(service)
        ? d.services.filter((s) => s !== service)
        : [...d.services, service],
    }));
  }, []);

  // ─── Share helpers ──────────────────────────────────────────

  const profileUrl = data.handle ? `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${data.handle}` : '';

  const copyLink = useCallback(() => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast.success('Link copied!');
      fireAnalytics('profile_link_copied', { creatorId });
    });
  }, [profileUrl, creatorId, fireAnalytics]);

  const shareWhatsApp = useCallback(() => {
    if (!profileUrl) return;
    const text = `Check out ${data.stageName || 'this creator'} on AfriSpine! ${profileUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    fireAnalytics('profile_shared', { creatorId, channel: 'whatsapp' });
  }, [profileUrl, data.stageName, creatorId, fireAnalytics]);

  // ─── No creatorId guard ─────────────────────────────────────

  if (!creatorId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md text-center">
          <Users className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Creator Account</h2>
          <p className="text-zinc-400 text-sm">
            Please sign up as a creator first to access the onboarding wizard.
          </p>
        </div>
      </div>
    );
  }

  // ─── Loading state ──────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {showConfetti && <Confetti />}

      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 px-4 pt-4 pb-2">
        <Progress
          value={(step / TOTAL_STEPS) * 100}
          className="h-2 [&>[data-slot=progress-indicator]]:bg-emerald-500 [&>[data-slot=progress]]:bg-emerald-500/20"
        />
        <p className="text-xs text-zinc-500 mt-1.5 text-center">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Step title */}
      <div className="px-4 pt-6 pb-2 text-center">
        <h1 className="text-2xl font-bold text-white">
          {STEP_TITLES[step]}
        </h1>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 1 && <StepCategory data={data} setData={setData} />}
              {step === 2 && <StepPhoto data={data} setData={setData} />}
              {step === 3 && (
                <StepStageNameHandle
                  data={data}
                  setData={setData}
                  handleStatus={handleStatus}
                  onHandleChange={onHandleChange}
                />
              )}
              {step === 4 && <StepLocation data={data} setData={setData} />}
              {step === 5 && <StepBio data={data} setData={setData} />}
              {step === 6 && <StepServices data={data} toggleService={toggleService} />}
              {step === 7 && <StepSampleContent />}
              {step === 8 && <StepPayout data={data} setData={setData} />}
              {step === 9 && <StepPublish data={data} category={data.category} />}
              {step === 10 && (
                <StepShare
                  stageName={data.stageName}
                  handle={data.handle}
                  profileUrl={profileUrl}
                  onCopyLink={copyLink}
                  onShareWhatsApp={shareWhatsApp}
                  onGoToStudio={() => navigate('creator-dashboard')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800/50 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 1 || step === 10}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 9 && (
            <Button
              onClick={goNext}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : step === 2 || step === 6 || step === 7 ? (
                'Skip & Continue'
              ) : (
                'Next'
              )}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 9 && (
            <Button
              onClick={goNext}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <PartyPopper className="w-4 h-4 mr-2" />
                  Publish Profile
                </>
              )}
            </Button>
          )}

          {step === 10 && (
            <Button
              onClick={() => navigate('creator-dashboard')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6"
            >
              Go to Creator Studio
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Category ──────────────────────────────────────────

function StepCategory({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const selected = data.category === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, category: cat.id }))}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200
              ${
                selected
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }
            `}
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm font-medium">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 2: Photo ─────────────────────────────────────────────

function StepPhoto({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  return (
    <div className="space-y-6">
      {/* Circular avatar area */}
      <div className="flex justify-center">
        <div className="relative">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt="Avatar preview"
              className="w-28 h-28 rounded-full object-cover border-2 border-emerald-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center bg-zinc-900">
              <Camera className="w-8 h-8 text-zinc-500" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Image URL</label>
        <Input
          placeholder="https://example.com/your-photo.jpg"
          value={data.avatarUrl}
          onChange={(e) => setData((d) => ({ ...d, avatarUrl: e.target.value }))}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500"
        />\n        <p className="text-xs text-zinc-500">
          Paste a link to your photo. File upload coming soon.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3: Stage Name & Handle ────────────────────────────────

function StepStageNameHandle({
  data,
  setData,
  handleStatus,
  onHandleChange,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
  handleStatus: HandleStatus;
  onHandleChange: (val: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stage Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Stage Name</label>
        <Input
          placeholder="Your public name"
          value={data.stageName}
          onChange={(e) => setData((d) => ({ ...d, stageName: e.target.value }))}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 text-lg focus:border-emerald-500 h-12"
        />
      </div>

      {/* Handle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Handle</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
            @
          </span>
          <Input
            placeholder="your_handle"
            value={data.handle}
            onChange={(e) => onHandleChange(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 pl-8 pr-10 h-12"
            maxLength={30}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {handleStatus === 'checking' && (
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
            )}
            {handleStatus === 'available' && (
              <Check className="w-4 h-4 text-emerald-500" />
            )}
            {handleStatus === 'taken' && (
              <X className="w-4 h-4 text-red-500" />
            )}
            {handleStatus === 'invalid' && (
              <X className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Lowercase, letters, numbers &amp; underscores only. 3–30 characters.
        </p>
        {handleStatus === 'taken' && (
          <p className="text-xs text-red-400">This handle is already taken. Try another.</p>
        )}
        {handleStatus === 'available' && data.handle.length >= 3 && (
          <p className="text-xs text-emerald-400">This handle is available!</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Location & Languages ───────────────────────────────

function StepLocation({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          <MapPin className="w-4 h-4 inline mr-1.5 text-emerald-500" />
          Location
        </label>
        <Input
          placeholder="Nairobi, Kenya"
          value={data.location}
          onChange={(e) => setData((d) => ({ ...d, location: e.target.value }))}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          <Languages className="w-4 h-4 inline mr-1.5 text-emerald-500" />
          Languages
        </label>
        <Input
          placeholder="English, Swahili"
          value={data.languages}
          onChange={(e) => setData((d) => ({ ...d, languages: e.target.value }))}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500"
        />
      </div>
    </div>
  );
}

// ─── Step 5: Bio ───────────────────────────────────────────────

function StepBio({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">
          <MessageSquare className="w-4 h-4 inline mr-1.5 text-emerald-500" />
          Bio
        </label>
        <span
          className={`text-xs font-mono ${
            data.bio.length > 280 ? 'text-red-400' : data.bio.length > 250 ? 'text-amber-400' : 'text-zinc-500'
          }`}
        >
          {data.bio.length}/300
        </span>
      </div>
      <Textarea
        placeholder="Tell fans what makes you unique..."
        value={data.bio}
        onChange={(e) => {
          if (e.target.value.length <= 300) {
            setData((d) => ({ ...d, bio: e.target.value }));
          }
        }}
        rows={5}
        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 resize-none"
      />
      <p className="text-xs text-zinc-500">
        This appears on your public profile. Keep it catchy!
      </p>
    </div>
  );
}

// ─── Step 6: Services ──────────────────────────────────────────

function StepServices({
  data,
  toggleService,
}: {
  data: WizardData;
  toggleService: (service: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">Select the services you offer (optional)</p>
      <div className="flex flex-wrap gap-2">
        {SERVICES.map((service) => {
          const selected = data.services.includes(service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }
              `}
            >
              {service}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 7: Sample Content ────────────────────────────────────

function StepSampleContent() {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
        <Upload className="w-7 h-7 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">Upload Content Later</h3>
      <p className="text-sm text-zinc-400 max-w-sm mx-auto">
        You can upload content from Creator Studio after publishing your profile.
      </p>
      <p className="text-xs text-zinc-600">
        We&apos;ll walk you through uploading your first video, setting ticket prices, and more.
      </p>
    </div>
  );
}

// ─── Step 8: Payout ────────────────────────────────────────────

function StepPayout({
  data,
  setData,
}: {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
        <Banknote className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-white">M-Pesa Payout</p>
          <p className="text-xs text-zinc-400 mt-1">
            Your earnings will be sent here. Make sure this is your M-Pesa number.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">M-Pesa Phone Number</label>
        <Input
          placeholder="+254 712 345 678"
          value={data.mpesaPayoutNumber}
          onChange={(e) => setData((d) => ({ ...d, mpesaPayoutNumber: e.target.value }))}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500"
          type="tel"
        />
        <p className="text-xs text-zinc-500">
          Include country code (e.g., +254 for Kenya).
        </p>
      </div>
    </div>
  );
}

// ─── Step 9: Publish / Summary ─────────────────────────────────

function StepPublish({
  data,
  category,
}: {
  data: WizardData;
  category: string;
}) {
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label || category;

  const summaryItems = [
    { label: 'Category', value: categoryLabel, icon: Sparkles },
    { label: 'Photo', value: data.avatarUrl ? 'Added' : 'Not set', icon: Camera },
    { label: 'Stage Name', value: data.stageName || '—', icon: Users },
    { label: 'Handle', value: data.handle ? `@${data.handle}` : '—', icon: Link2 },
    { label: 'Location', value: data.location || '—', icon: MapPin },
    { label: 'Languages', value: data.languages || '—', icon: Languages },
    { label: 'Bio', value: data.bio ? `${data.bio.slice(0, 80)}${data.bio.length > 80 ? '…' : ''}` : '—', icon: MessageSquare },
    { label: 'Services', value: data.services.length > 0 ? data.services.join(', ') : 'None selected', icon: Mic },
    { label: 'Payout', value: data.mpesaPayoutNumber || '—', icon: Banknote },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-semibold text-white">Profile Preview</h3>
        </div>

        <div className="space-y-3">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="text-sm text-zinc-200 break-words">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500 text-center">
        Review your details above. You can always update them from Creator Studio later.
      </p>
    </div>
  );
}

// ─── Step 10: Share ────────────────────────────────────────────

function StepShare({
  stageName,
  handle,
  profileUrl,
  onCopyLink,
  onShareWhatsApp,
  onGoToStudio,
}: {
  stageName: string;
  handle: string;
  profileUrl: string;
  onCopyLink: () => void;
  onShareWhatsApp: () => void;
  onGoToStudio: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-4">
      {/* Success message */}
      <div className="space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <PartyPopper className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Profile is Live!</h2>
        <p className="text-sm text-zinc-400">
          {stageName ? `${stageName}'s` : 'Your'} profile is now visible to everyone.
        </p>
      </div>

      {/* Profile URL */}
      {profileUrl && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-zinc-500 font-medium">Your Profile URL</p>
          <p className="text-sm text-emerald-400 break-all font-mono">{profileUrl}</p>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onShareWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={onCopyLink}
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={onGoToStudio}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full"
        size="lg"
      >
        Go to Creator Studio
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
