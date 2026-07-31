'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
  User,
  Phone,
  Calendar,
  MapPin,
  Eye,
  Shield,
  Search,
  AlertOctagon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const idTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'driving_licence', label: "Driver's Licence" },
  { value: 'voters_card', label: "Voter's Card" },
];

const kycStatusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending Verification' },
  approved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Verified' },
  manual_review: { color: 'bg-blue-100 text-blue-700', icon: Eye, label: 'Under Review' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
};

export function KycPage() {
  const sender = useAppStore((s) => s.sender);
  const sessionToken = useAppStore((s) => s.sessionToken);
  const [kycData, setKycData] = useState<{
    kycStatus: string;
    kycIdType: string | null;
    kycIdNumber: string | null;
    kycCompletedAt: string | null;
    firstName: string;
    lastName: string;
    phone: string;
    countryOfResidence: string;
    dob: string | null;
    dailyLimitGbp: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');

  // PEP/AML screening state
  const [pepChecking, setPepChecking] = useState(false);
  const [pepResult, setPepResult] = useState<{
    status: string;
    isPep: boolean;
    isSanctioned: boolean;
    pepCount: number;
    sanctionCount: number;
    pepSummary: { country?: string; function?: string; specific?: string; active?: boolean }[];
    checkedAt: string;
  } | null>(null);
  const [pepHistory, setPepHistory] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    isPep: boolean;
    isSanctioned: boolean;
    pepCount: number;
    sanctionCount: number;
    status: string;
    checkedAt: string;
  }[]>([]);

  const fetchKycStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const s = data.sender;
        setKycData({
          kycStatus: s.kycStatus || 'pending',
          kycIdType: s.kycIdType || null,
          kycIdNumber: s.kycIdNumber || null,
          kycCompletedAt: s.kycCompletedAt || null,
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          phone: s.phone || '',
          countryOfResidence: s.countryOfResidence || '',
          dob: s.dob || null,
          dailyLimitGbp: s.dailyLimitGbp || 2000,
        });
        if (s.kycIdType) setIdType(s.kycIdType);
        if (s.kycIdNumber) setIdNumber(s.kycIdNumber);
      }
    } catch {
      toast.error('Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKycStatus();
  }, [fetchKycStatus]);

  const handleSubmitKyc = async () => {
    if (!idType) {
      toast.error('Please select an ID type');
      return;
    }
    if (!idNumber || idNumber.length < 5) {
      toast.error('Please enter a valid ID number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: sender?.id,
          idType,
          idNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          data.kycStatus === 'approved'
            ? 'Identity verified successfully!'
            : 'KYC submitted. Your documents are under review.'
        );
        fetchKycStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'KYC submission failed');
      }
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPepHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/kyc/pep-check');
      if (res.ok) {
        const data = await res.json();
        setPepHistory(data.checks || []);
        if (data.checks?.length > 0) {
          const latest = data.checks[0];
          setPepResult({
            status: latest.status,
            isPep: latest.isPep,
            isSanctioned: latest.isSanctioned,
            pepCount: latest.pepCount,
            sanctionCount: latest.sanctionCount,
            pepSummary: [],
            checkedAt: latest.checkedAt,
          });
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  const handlePepCheck = async () => {
    if (!kycData?.firstName || !kycData?.lastName) {
      toast.error('Please complete your profile with first and last name first');
      return;
    }
    setPepChecking(true);
    try {
      const res = await fetch('/api/kyc/pep-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: kycData.firstName,
          lastName: kycData.lastName,
          dobStart: kycData.dob || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPepResult({
          status: data.status,
          isPep: data.isPep,
          isSanctioned: data.isSanctioned,
          pepCount: data.pepCount,
          sanctionCount: data.sanctionCount,
          pepSummary: data.pepSummary || [],
          checkedAt: data.checkedAt,
        });
        if (data.status === 'clear') {
          toast.success('AML screening passed — no PEP or sanctions matches found.');
        } else if (data.status === 'pep_review') {
          toast.warning('Potential PEP match found. Our compliance team will review your account.');
        } else if (data.status === 'sanctioned') {
          toast.error('Sanctions match detected. Your account has been flagged for review.');
        }
        fetchPepHistory();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'AML screening failed');
      }
    } catch {
      toast.error('Network error during AML screening');
    } finally {
      setPepChecking(false);
    }
  };

  useEffect(() => {
    fetchPepHistory();
  }, [fetchPepHistory]);

  const statusCfg = kycData ? kycStatusConfig[kycData.kycStatus] || kycStatusConfig.pending : null;
  const isVerified = kycData?.kycStatus === 'approved';
  const isPending = kycData?.kycStatus === 'pending';
  const isReview = kycData?.kycStatus === 'manual_review';

  const fullName = kycData
    ? `${kycData.firstName} ${kycData.lastName}`.trim()
    : sender?.fullName || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-muted-foreground">
          Verify your identity to unlock higher transfer limits
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Status banner */}
          {statusCfg && (
            <Card className={`border-2 ${isVerified ? 'border-emerald-200 bg-emerald-50/50' : isPending ? 'border-amber-200 bg-amber-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${statusCfg.color}`}>
                  {React.createElement(statusCfg.icon, { className: 'h-6 w-6' })}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{statusCfg.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isVerified
                      ? `Verified on ${kycData?.kycCompletedAt ? new Date(kycData.kycCompletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'a previous date'}. Your transfer limit is kycData?.dailyLimitGbp || 2000).toLocaleString()} per day.`
                      : isPending
                        ? 'Complete the form below to verify your identity and increase your transfer limits.'
                        : isReview
                          ? 'Your documents are being reviewed by our compliance team. This usually takes 1-2 business days.'
                          : 'Your verification was rejected. Please re-submit with correct details.'}
                  </p>
                </div>
                <Badge className={statusCfg.color}>
                  {statusCfg.label}
                </Badge>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your account details used for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                    {fullName
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{fullName || 'Not set'}</p>
                    <p className="text-sm text-muted-foreground">{sender?.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Full Name: {fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Phone: {kycData?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Country: {kycData?.countryOfResidence || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Date of Birth: {kycData?.dob || 'Not provided'}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                  To update your personal details, go to your Profile page and click Edit details.
                </div>
              </CardContent>
            </Card>

            {/* KYC Verification Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Identity Verification
                </CardTitle>
                <CardDescription>
                  {isVerified
                    ? 'Your identity has been verified.'
                    : 'Submit your government-issued ID details'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isVerified ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">
                          Identity Verified
                        </p>
                        <p className="text-xs text-emerald-700">
                          Document: {kycData?.kycIdType?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Document type</span>
                        </div>
                        <span className="font-medium capitalize">
                          {kycData?.kycIdType?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ShieldCheck className="h-4 w-4" />
                          <span>ID Number</span>
                        </div>
                        <span className="font-medium font-mono">
                          {kycData?.kycIdNumber
                            ? kycData.kycIdNumber.slice(0, 3) + '****' + kycData.kycIdNumber.slice(-3)
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Verified on</span>
                        </div>
                        <span className="font-medium">
                          {kycData?.kycCompletedAt
                            ? new Date(kycData.kycCompletedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                          Please ensure your ID details match your profile information exactly. 
                          Mismatched details may delay or reject your verification.
                        </p>
                      </div>
                    </div>

                    {/* ID Type */}
                    <div className="grid gap-2">
                      <Label>ID Type</Label>
                      <Select value={idType} onValueChange={setIdType} disabled={isReview}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          {idTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ID Number */}
                    <div className="grid gap-2">
                      <Label htmlFor="kyc-id-number">ID Number</Label>
                      <Input
                        id="kyc-id-number"
                        placeholder="Enter your ID number"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                        disabled={isReview}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Enter the number as it appears on your document
                      </p>
                    </div>

                    {/* Limits info */}
                    <div className="rounded-lg bg-gray-50 p-3 space-y-2 text-sm">
                      <p className="font-medium text-gray-700">Transfer Limits</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Unverified limit</span>
                        <span className="font-medium">$2,000 / day</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Verified limit</span>
                        <span className="font-medium text-emerald-700">$10,000 / day</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitKyc}
                      disabled={submitting || isReview || !idType || !idNumber}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : isReview ? (
                        'Under Review'
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Submit Verification
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── PEP & Sanctions Screening (PEPChecker) ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    AML &amp; PEP Screening
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Powered by PEPChecker — Politically Exposed Person and sanctions screening
                  </CardDescription>
                </div>
                <img src="/partner-pepchecker.png" alt="PEPChecker" className="h-8 w-auto object-contain rounded opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current result */}
              {pepResult ? (
                <div className={`rounded-lg border p-4 ${pepResult.status === 'clear' ? 'border-emerald-200 bg-emerald-50' : pepResult.status === 'sanctioned' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center gap-3">
                    {pepResult.status === 'clear' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : pepResult.status === 'sanctioned' ? (
                      <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {pepResult.status === 'clear'
                          ? 'No PEP or sanctions matches found'
                          : pepResult.status === 'sanctioned'
                            ? 'Sanctions match detected — account restricted'
                            : `PEP match found — ${pepResult.pepCount} potential match${pepResult.pepCount > 1 ? 'es' : ''}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Checked on {new Date(pepResult.checkedAt).toLocaleString('en-GB')} for {kycData?.firstName} {kycData?.lastName}
                      </p>
                    </div>
                    <Badge className={
                      pepResult.status === 'clear'
                        ? 'bg-emerald-100 text-emerald-700'
                        : pepResult.status === 'sanctioned'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }>
                      {pepResult.status === 'clear' ? 'Clear' : pepResult.status === 'sanctioned' ? 'Flagged' : 'Review'}
                    </Badge>
                  </div>
                  {pepResult.pepSummary.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Potential matches (summary):</p>
                      {pepResult.pepSummary.map((match, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{match.country}{match.specific ? ` — ${match.specific}` : ''}{match.active !== undefined ? (match.active ? ' (Active)' : ' (Inactive)') : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No AML screening performed yet</p>
                  <p className="text-xs text-muted-foreground/60">Run a check to verify your PEP and sanctions status</p>
                </div>
              )}

              {/* Run check button */}
              <Button
                onClick={handlePepCheck}
                disabled={pepChecking || !kycData?.firstName || !kycData?.lastName}
                variant="outline"
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {pepChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running AML screening...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {pepResult ? 'Re-run AML Screening' : 'Run AML Screening'}
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground/60 text-center">
                This screens your name against global PEP and sanctions databases via PEPChecker. Results are stored securely and reviewed by our compliance team if any matches are found.
              </p>

              {/* History */}
              {pepHistory.length > 1 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Screening History</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pepHistory.slice(0, 10).map((check) => (
                        <div key={check.id} className="flex items-center justify-between text-xs rounded-lg border border-border/50 p-2.5">
                          <div className="flex items-center gap-2">
                            {check.status === 'clear' ? (
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            ) : check.status === 'sanctioned' ? (
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <span className="text-muted-foreground">{check.firstName} {check.lastName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {check.isPep && <Badge variant="outline" className="text-[10px] py-0">PEP</Badge>}
                            {check.isSanctioned && <Badge variant="outline" className="text-[10px] py-0 text-red-600">Sanctioned</Badge>}
                            {!check.isPep && !check.isSanctioned && <span className="text-emerald-600 font-medium">Clear</span>}
                            <span className="text-muted-foreground/60">{new Date(check.checkedAt).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Why verification matters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why verify your identity?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium">Higher Limits</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send up to $10,000 per day after verification
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">Faster Transfers</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verified users skip additional compliance checks
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">Regulatory Compliance</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Meet FCA and Central Bank requirements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}