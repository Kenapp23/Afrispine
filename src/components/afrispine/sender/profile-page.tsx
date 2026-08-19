'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ReferralShareButtons } from '@/components/afrispine/common/referral-share';
import { TopSupportersStrip, ReferralBadge } from '@/components/afrispine/sender/top-supporters-strip';
import { MyZoneTab } from '@/components/afrispine/sender/my-zone-tab';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck,
  User,
  Phone,
  MapPin,
  FileText,
  Users,
  Loader2,
  Calendar,
  Pencil,
  Check,
  MessageCircle,
  Mail,
  Globe,
  Clock,
  Star,
  TrendingUp,
  Banknote,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

interface SenderData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dob: string | null;
  countryOfResidence: string;
  kycStatus: string;
  kycIdType: string | null;
  kycCompletedAt: string | null;
  dailyLimitGbp: number;
  referralCode: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Recipient {
  id: string;
  fullName: string;
  phone: string;
  country: string;
}

interface ReferralStats {
  phone: string;
  totalEarnings: number;
  totalPaid: number;
  totalUnpaid: number;
  totalReferrals: number;
  recentRewards: unknown[];
}

// ─── Constants ───────────────────────────────────────────────────

const countries = [
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'KE', label: 'Kenya', flag: '🇰🇪' },
  { value: 'NG', label: 'Nigeria', flag: '🇳🇬' },
  { value: 'GH', label: 'Ghana', flag: '🇬🇭' },
  { value: 'UG', label: 'Uganda', flag: '🇺🇬' },
  { value: 'TZ', label: 'Tanzania', flag: '🇹🇿' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'ZA', label: 'South Africa', flag: '🇿🇦' },
  { value: 'OTHER', label: 'Other', flag: '🌐' },
];

const COUNTRY_MAP: Record<string, string> = Object.fromEntries(
  countries.map((c) => [c.value, c.flag]),
);

// ─── Animation Variants ──────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
};

// ─── Helpers ─────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function getCountryLabel(code: string): string {
  return countries.find((c) => c.value === code)?.label || code;
}

function getCountryFlag(code: string): string {
  return COUNTRY_MAP[code] || '🌐';
}

function normalizePhoneForApi(phone: string): string | null {
  // Strip non-digits
  const digits = phone.replace(/\D/g, '');
  // If starts with 254 and has 12 digits total → valid
  if (/^254\d{9}$/.test(digits)) return digits;
  // If starts with 0 and has 10 digits (Kenya local) → convert
  if (/^0\d{9}$/.test(digits)) return '254' + digits.slice(1);
  // If starts with +254 → strip +
  if (/^\+?254\d{9}$/.test(digits)) return '254' + digits.replace(/^\+?254/, '');
  return null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getAccountAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const months = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
  );
  if (months < 1) return '< 1 month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years}y` : `${years}y ${rem}m`;
}

// ─── Component ───────────────────────────────────────────────────

export function ProfilePage() {
  const sender = useAppStore((s) => s.sender);
  const loginAsSender = useAppStore((s) => s.loginAsSender);
  const sessionToken = useAppStore((s) => s.sessionToken);
  const navigate = useAppStore((s) => s.navigate);

  // ── Data state ──
  const [profileData, setProfileData] = useState<SenderData | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralLoading, setReferralLoading] = useState(true);

  // ── UI state ──
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    countryOfResidence: '',
  });
  const [saving, setSaving] = useState(false);
  const [whatsappOptedIn, setWhatsappOptedIn] = useState(true);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [myZoneActive, setMyZoneActive] = useState(false);

  // ── Derived values ──
  const name = profileData
    ? `${profileData.firstName} ${profileData.lastName}`.trim()
    : sender?.fullName || 'User';
  const email = profileData?.email || sender?.email || '';
  const phone = profileData?.phone || sender?.phone || '';
  const country = profileData?.countryOfResidence || '';
  const kycStatus = profileData?.kycStatus || 'pending';
  const kycIdType = profileData?.kycIdType;
  const kycCompletedAt = profileData?.kycCompletedAt;
  const dailyLimit = profileData?.dailyLimitGbp || 2000;
  const emailVerified = profileData?.emailVerified ?? false;
  const createdAt = profileData?.createdAt || '';
  const referralCount = referralStats?.totalReferrals ?? 0;
  const referralEarnings = referralStats?.totalEarnings ?? 0;

  const kycBadge =
    kycStatus === 'approved'
      ? { label: 'Verified', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
      : kycStatus === 'manual_review'
        ? { label: 'Under Review', className: 'bg-sky-100 text-sky-700 border-sky-200' }
        : kycStatus === 'rejected'
          ? { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' }
          : { label: 'Not Verified', className: 'bg-amber-100 text-amber-700 border-amber-200' };

  // ── Fetchers ──

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.sender);
        setEditForm({
          firstName: data.sender.firstName || '',
          lastName: data.sender.lastName || '',
          phone: data.sender.phone || '',
          dob: data.sender.dob || '',
          countryOfResidence: data.sender.countryOfResidence || '',
        });
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch('/api/recipients');
      if (res.ok) {
        const data = await res.json();
        setRecipients(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchReferralStats = useCallback(async (p: string) => {
    const apiPhone = normalizePhoneForApi(p);
    if (!apiPhone) {
      setReferralLoading(false);
      return;
    }
    try {
      setReferralLoading(true);
      const res = await fetch(`/api/content/referral/stats?phone=${apiPhone}`);
      if (res.ok) {
        const data = await res.json();
        setReferralStats(data);
      }
    } catch {
      // Graceful — referral stats are supplementary
    } finally {
      setReferralLoading(false);
    }
  }, []);

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/opt-in');
      if (res.ok) {
        const data = await res.json();
        setWhatsappOptedIn(data.optedIn);
      }
    } catch {
      // Default to opted in
    }
  };

  // ── Effects ──

  useEffect(() => {
    fetchProfile();
    fetchRecipients();
    fetchWhatsAppStatus();
  }, [fetchProfile, fetchRecipients]);

  // Fetch referral stats when phone becomes available
  useEffect(() => {
    if (phone) {
      fetchReferralStats(phone);
    }
  }, [phone, fetchReferralStats]);

  // ── Handlers ──

  const toggleWhatsAppOptIn = async () => {
    setWhatsappLoading(true);
    try {
      const res = await fetch('/api/whatsapp/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: !whatsappOptedIn }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappOptedIn(data.optedIn);
        toast.success(
          data.optedIn
            ? 'WhatsApp notifications enabled'
            : 'WhatsApp notifications disabled',
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update preference');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Profile updated successfully');
        setEditOpen(false);
        if (sessionToken) {
          const updatedSender = {
            ...data.sender,
            fullName: `${data.sender.firstName} ${data.sender.lastName}`.trim(),
          };
          loginAsSender(updatedSender, sessionToken);
        }
        fetchProfile();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ──

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border border-emerald-100 p-6">
          <div className="flex items-start gap-5">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-100 p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── 1. Hero Card ─────────────────────────────────────── */}
      <motion.div
        custom={0}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border border-emerald-100 shadow-sm">
          {/* Decorative top bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold shadow-sm ring-4 ring-white ${
                    emailVerified
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                  }`}
                >
                  {getInitials(name) || 'U'}
                </div>
                {emailVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-emerald-200">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {name || 'Not set'}
                  </h1>
                  {country && (
                    <span className="text-lg" title={getCountryLabel(country)}>
                      {getCountryFlag(country)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <Badge variant="outline" className={kycBadge.className}>
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    {kycBadge.label}
                  </Badge>
                  <ReferralBadge referralCount={referralCount} />
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{phone}</span>
                    </div>
                  )}
                  {country && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      <span>{getCountryLabel(country)}</span>
                    </div>
                  )}
                  {createdAt && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">Joined {formatDate(createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit + My Zone buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  className={
                    myZoneActive
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }
                  variant={myZoneActive ? 'default' : 'outline'}
                  onClick={() => setMyZoneActive(!myZoneActive)}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  My Zone
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  onClick={() => {
                    setEditForm({
                      firstName: profileData?.firstName || '',
                      lastName: profileData?.lastName || '',
                      phone: profileData?.phone || '',
                      dob: profileData?.dob || '',
                      countryOfResidence: profileData?.countryOfResidence || '',
                    });
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── My Zone Tab (alternate view) ─────────────────── */}
      {myZoneActive ? (
        <MyZoneTab />
      ) : (
        <>
      {/* ── 2. Stats Row ─────────────────────────────────────── */}
      <motion.div
        custom={1}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total Referrals */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 hover:shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Referrals</span>
            </div>
            {referralLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {referralCount}
              </p>
            )}
          </div>

          {/* Referral Earnings */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 hover:shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <Banknote className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Earnings KES</span>
            </div>
            {referralLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {referralEarnings.toLocaleString()}
              </p>
            )}
          </div>

          {/* Saved Recipients */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 hover:shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                <HeartHandshake className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Recipients</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {recipients.length}
            </p>
          </div>

          {/* Account Age */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 hover:shadow-sm hover:border-emerald-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <Clock className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Account Age</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {createdAt ? getAccountAge(createdAt) : '—'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 3. Top Supporters Strip ───────────────────────────── */}
      <motion.div
        custom={2}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <TopSupportersStrip />
      </motion.div>

      {/* ── 4. Referral & Share Section ───────────────────────── */}
      {profileData?.referralCode && (
        <motion.div
          custom={3}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white overflow-hidden">
            <div className="px-5 pt-4 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Refer & Earn
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                Share your link and earn rewards when friends join AfriSpine.
              </p>
            </div>
            <div className="p-5 pt-3">
              <ReferralShareButtons referralCode={profileData.referralCode} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 5. WhatsApp Notifications ─────────────────────────── */}
      <motion.div
        custom={4}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="rounded-xl bg-white border border-gray-100 p-5 hover:shadow-sm transition-all">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    WhatsApp Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Get transfer confirmations and referral alerts
                  </p>
                </div>
                <button
                  onClick={toggleWhatsAppOptIn}
                  disabled={!phone || whatsappLoading}
                  className={`
                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
                    ${whatsappOptedIn ? 'bg-emerald-600' : 'bg-gray-200'}
                    ${(!phone || whatsappLoading) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  role="switch"
                  aria-checked={whatsappOptedIn}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${whatsappOptedIn ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
              <p className="mt-2.5 text-[11px] text-gray-400">
                {whatsappOptedIn
                  ? 'You\'ll receive important updates on WhatsApp.'
                  : !phone
                    ? 'Add a phone number to enable WhatsApp alerts.'
                    : 'Enable to get real-time notifications.'}
                {' '}Reply STOP to unsubscribe.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 6. Saved Recipients ───────────────────────────────── */}
      <motion.div
        custom={5}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Saved Recipients
              </h2>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 text-[11px]"
              >
                {recipients.length}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Your frequent transfer contacts
            </p>
          </div>
          <div className="p-5 pt-3">
            {recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3">
                  <Users className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">
                  No saved recipients yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Start a transfer to add one
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-96 overflow-y-auto pr-1">
                {recipients.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all group cursor-default"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 font-semibold text-sm">
                      {getInitials(r.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.fullName}
                      </p>
                      <p className="text-xs text-gray-400">{r.phone}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[11px] shrink-0 bg-gray-50 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors"
                    >
                      {r.country}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 7. KYC Verification ───────────────────────────────── */}
      <motion.div
        custom={6}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${kycStatus === 'approved' ? 'text-emerald-600' : 'text-gray-400'}`} />
              <h2 className="text-sm font-semibold text-gray-900">
                Identity Verification
              </h2>
              <Badge variant="outline" className={`${kycBadge.className} text-[11px]`}>
                {kycBadge.label}
              </Badge>
            </div>
          </div>
          <div className="p-5 pt-3">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  kycStatus === 'approved'
                    ? 'bg-emerald-100'
                    : kycStatus === 'rejected'
                      ? 'bg-red-100'
                      : 'bg-amber-100'
                }`}
              >
                <ShieldCheck
                  className={`h-6 w-6 ${
                    kycStatus === 'approved'
                      ? 'text-emerald-600'
                      : kycStatus === 'rejected'
                        ? 'text-red-500'
                        : 'text-amber-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {kycStatus === 'approved'
                    ? 'Identity verified'
                    : kycStatus === 'manual_review'
                      ? 'Your documents are under review'
                      : kycStatus === 'rejected'
                        ? 'Verification was rejected'
                        : 'Verify to unlock higher transfer limits'}
                </p>
                {kycCompletedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Verified on {formatDate(kycCompletedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {kycIdType && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <FileText className="h-3 w-3" />
                    <span>Document Type</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {kycIdType.replace('_', ' ')}
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Banknote className="h-3 w-3" />
                  <span>Daily Limit</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  £{dailyLimit.toLocaleString()}
                </p>
              </div>
            </div>

            {kycStatus !== 'approved' && (
              <Button
                size="sm"
                className="w-full mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => navigate('verify')}
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {kycStatus === 'rejected' ? 'Re-submit Verification' : 'Verify Now'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

        </>
      )}

      {/* ── Edit Profile Dialog ──────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Personal Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-first">First Name</Label>
                <Input
                  id="edit-first"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                  placeholder="First name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last">Last Name</Label>
                <Input
                  id="edit-last"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                placeholder="+44 7700 000000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editForm.dob}
                onChange={(e) =>
                  setEditForm({ ...editForm, dob: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Country of Residence</Label>
              <Select
                value={editForm.countryOfResidence}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, countryOfResidence: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.flag} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
