'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import {
  Users,
  Plus,
  ArrowLeft,
  CircleDollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  PiggyBank,
  HandCoins,
  LogOut,
  Copy,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSavingsCircleName } from '@/lib/savings-circle-names';

// ─── Types ──────────────────────────────────────────────────────────────────
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

interface Circle {
  id: string;
  name: string;
  slug: string;
  organiserId: string;
  type: string;
  memberCount: number;
  contributionAmount: number;
  contributionCurrency: string;
  frequency: string;
  currentCycle: number;
  nextPayoutDate: string | null;
  totalPot: number;
  whatsappGroupId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  members: CircleMember[];
  payments: CirclePayment[];
  paidThisCycle?: Set<string>;
  organiser: { id: string; firstName: string; lastName: string; email: string };
  _count?: { members: number; payments: number };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  chama: 'Chama',
  esusu: 'Esusu',
  susu: 'Susu',
  roscas: 'ROSCAS',
  general: 'General',
  investment: 'Investment',
  welfare: 'Welfare',
  christmas: 'Christmas',
  grocery: 'Grocery',
  burial_society: 'Burial Society',
};

const TYPE_COLORS: Record<string, string> = {
  chama: 'bg-emerald-100 text-emerald-800',
  esusu: 'bg-amber-100 text-amber-800',
  susu: 'bg-orange-100 text-orange-800',
  roscas: 'bg-rose-100 text-rose-800',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  KES: 'KSh',
  NGN: '₦',
};

function fmtMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Country name → ISO code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  kenya: 'KE', nigeria: 'NG', ghana: 'GH', south_africa: 'ZA',
  'south africa': 'ZA', senegal: 'SN', 'côte d\'ivoire': 'CI',
  'cote d\'ivoire': 'CI', cameroon: 'CM', ethiopia: 'ET', eritrea: 'ER',
  tanzania: 'TZ', uganda: 'UG',
};

function countryFlagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  const c = code.toUpperCase();
  return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
}

function deriveCountryCode(sender: any, detectedCountry: string | null): string | undefined {
  const cor = (sender?.countryOfResidence || '').toLowerCase().trim();
  if (cor && COUNTRY_NAME_TO_CODE[cor]) return COUNTRY_NAME_TO_CODE[cor];
  if (detectedCountry) return detectedCountry.toUpperCase();
  return undefined;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateShort(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Component ──────────────────────────────────────────────────────────────
export function ChamaPage() {
  const sender = useAppStore((s) => s.sender);
  const detectedCountry = useAppStore((s) => s.detectedCountry);
  const { toast } = useToast();

  // Cultural naming based on sender's country
  const countryCode = deriveCountryCode(sender, detectedCountry);
  const circleName = getSavingsCircleName(countryCode);
  const countryFlag = countryFlagEmoji(countryCode || '');

  // View state
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create circle dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: circleName.types?.[0]?.value || 'general',
    contributionAmount: '',
    contributionCurrency: 'GBP',
    frequency: 'monthly',
  });
  const [creating, setCreating] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ memberName: '', phone: '', email: '' });
  const [addingMember, setAddingMember] = useState(false);

  // Join circle dialog
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinSlug, setJoinSlug] = useState('');
  const [joining, setJoining] = useState(false);

  // Contribute loading per member
  const [contributingFor, setContributingFor] = useState<string | null>(null);

  // Fetch circles
  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chama/circles');
      if (res.ok) {
        const data = await res.json();
        setCircles(data.circles || []);
      }
    } catch {
      toast({ title: 'Failed to load circles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Fetch circle detail
  const fetchDetail = useCallback(async (circleId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/chama/circles/${circleId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCircle(data.circle);
      }
    } catch {
      toast({ title: 'Failed to load circle details', variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  }, [toast]);

  // Create circle
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.contributionAmount) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    try {
      setCreating(true);
      const res = await fetch('/api/chama/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Circle created successfully!', description: `Invite code: ${data.circle.slug}` });
        setCreateOpen(false);
        setCreateForm({ name: '', type: circleName.types?.[0]?.value || 'general', contributionAmount: '', contributionCurrency: 'GBP', frequency: 'monthly' });
        await fetchCircles();
        // Open the newly created circle
        setSelectedCircle(data.circle);
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Failed to create circle', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!selectedCircle || !addMemberForm.memberName.trim()) return;
    try {
      setAddingMember(true);
      const res = await fetch(`/api/chama/circles/${selectedCircle.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addMemberForm),
      });
      if (res.ok) {
        toast({ title: `${addMemberForm.memberName} added to circle` });
        setAddMemberOpen(false);
        setAddMemberForm({ memberName: '', phone: '', email: '' });
        await fetchDetail(selectedCircle.id);
        await fetchCircles();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Failed to add member', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  // Record contribution
  const handleContribute = async (memberName: string) => {
    if (!selectedCircle) return;
    try {
      setContributingFor(memberName);
      const res = await fetch(`/api/chama/circles/${selectedCircle.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberName }),
      });
      if (res.ok) {
        toast({ title: 'Contribution recorded!', description: `${memberName}'s payment has been recorded.` });
        await fetchDetail(selectedCircle.id);
        await fetchCircles();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Failed to record contribution', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setContributingFor(null);
    }
  };

  // Join circle
  const handleJoin = async () => {
    if (!joinSlug.trim()) {
      toast({ title: 'Please enter an invite code', variant: 'destructive' });
      return;
    }
    try {
      setJoining(true);
      const res = await fetch(`/api/chama/circles/${selectedCircle?.id || 'none'}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: joinSlug.trim() }),
      });
      if (res.ok) {
        toast({ title: 'Joined circle successfully!' });
        setJoinOpen(false);
        setJoinSlug('');
        await fetchCircles();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Failed to join circle', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  // Copy invite code
  const copyInviteCode = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast({ title: 'Invite code copied!', description: slug });
  };

  // Leave circle (organiser can't leave)
  const handleLeave = async () => {
    if (!selectedCircle || selectedCircle.organiserId === sender?.id) {
      toast({ title: 'Organiser cannot leave the circle', variant: 'destructive' });
      return;
    }
    try {
      // Remove member from circle
      const member = selectedCircle.members.find((m) => m.senderId === sender?.id);
      if (!member) return;
      await fetch(`/api/chama/circles/${selectedCircle.id}/members/${member.id}`, { method: 'DELETE' });
      toast({ title: 'You have left the circle' });
      setSelectedCircle(null);
      await fetchCircles();
    } catch {
      toast({ title: 'Failed to leave circle', variant: 'destructive' });
    }
  };

  const isOrganiser = selectedCircle?.organiserId === sender?.id;
  const myMember = selectedCircle?.members.find((m) => m.senderId === sender?.id);

  // ─── Detail View ────────────────────────────────────────────────
  if (selectedCircle) {
    if (detailLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      );
    }

    const paidThisCycle = selectedCircle.paidThisCycle instanceof Set
      ? selectedCircle.paidThisCycle
      : new Set<string>();

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => { setSelectedCircle(null); fetchCircles(); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 -ml-2 hover:bg-muted/60"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Circles</span>
        </button>

        {/* Circle Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{selectedCircle.name}</h1>
              <Badge className={TYPE_COLORS[selectedCircle.type] || 'bg-gray-100 text-gray-800'}>
                {TYPE_LABELS[selectedCircle.type] || selectedCircle.type}
              </Badge>
              <Badge
                variant="outline"
                className={selectedCircle.status === 'active' ? 'border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-500'}
              >
                {selectedCircle.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Organised by {selectedCircle.organiser.firstName} {selectedCircle.organiser.lastName}
              {selectedCircle.frequency === 'monthly' ? ' · Monthly contributions' : ' · Weekly contributions'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyInviteCode(selectedCircle.slug)}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Invite Code
            </Button>
            {isOrganiser && (
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-3.5 w-3.5" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        placeholder="Member's full name"
                        value={addMemberForm.memberName}
                        onChange={(e) => setAddMemberForm({ ...addMemberForm, memberName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        placeholder="+254 712 345 678"
                        value={addMemberForm.phone}
                        onChange={(e) => setAddMemberForm({ ...addMemberForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="member@example.com"
                        value={addMemberForm.email}
                        onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddMember} disabled={addingMember} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      {addingMember && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <CircleDollarSign className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Pot</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {fmtMoney(selectedCircle.totalPot, selectedCircle.contributionCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Members</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{selectedCircle.members.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <HandCoins className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Your Contributions</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {myMember ? fmtMoney(myMember.totalContributed, selectedCircle.contributionCurrency) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Next Payout</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {selectedCircle.nextPayoutDate ? fmtDateShort(selectedCircle.nextPayoutDate) : 'TBD'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
              <span className="text-sm font-normal text-muted-foreground">
                ({paidThisCycle.size}/{selectedCircle.members.length} paid this cycle)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm">
                  <tr className="border-b border-border/40">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Contributed</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Last Payment</th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCircle.members.map((member) => {
                    const hasPaid = paidThisCycle.has(member.memberName);
                    const isYou = member.senderId === sender?.id;
                    return (
                      <tr key={member.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{member.positionInRotation}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{member.memberName}</span>
                            {isYou && <Badge variant="outline" className="text-xs px-1.5 py-0">You</Badge>}
                            {member.hasReceivedPayout && (
                              <span className="text-amber-500" title="Has received a payout">★</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{member.phone || '—'}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {fmtMoney(member.totalContributed, selectedCircle.contributionCurrency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {fmtDateShort(member.lastPaymentAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasPaid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!hasPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              disabled={contributingFor === member.memberName}
                              onClick={() => handleContribute(member.memberName)}
                            >
                              {contributingFor === member.memberName ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <HandCoins className="h-3 w-3" />
                              )}
                              Record
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Info */}
        <Card className="bg-amber-50/50 border-amber-200/60">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">Contribution Details</p>
              <p className="text-sm text-amber-800/80 mt-0.5">
                Each member contributes <strong>{fmtMoney(selectedCircle.contributionAmount, selectedCircle.contributionCurrency)}</strong> {selectedCircle.frequency}.
                The total pot is <strong>{fmtMoney(selectedCircle.contributionAmount * selectedCircle.members.length, selectedCircle.contributionCurrency)}</strong> per cycle.
                Payout rotates by position — currently on cycle <strong>{selectedCircle.currentCycle}</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-72 overflow-y-auto">
              {selectedCircle.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No payments recorded yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm">
                    <tr className="border-b border-border/40">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Member</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Cycle</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCircle.payments.slice(0, 20).map((payment) => (
                      <tr key={payment.id} className="border-b border-border/20">
                        <td className="px-4 py-2.5 font-medium">{payment.memberName}</td>
                        <td className="px-4 py-2.5 text-right">
                          {fmtMoney(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                          {payment.cycleMonth.replace('cycle-', 'C')}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {payment.paidAt ? fmtDate(payment.paidAt) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Circle */}
        {!isOrganiser && (
          <div className="flex justify-end">
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5" onClick={handleLeave}>
              <LogOut className="h-4 w-4" />
              Leave Circle
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Savings Circles ({circleName.plural})</h1>
            {countryFlag && countryCode && (
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-0.5 text-sm font-medium">
                <span className="text-base leading-none">{countryFlag}</span>
                {circleName.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {circleName.tagline} — rotating savings with friends and family.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Users className="h-4 w-4" />
                Join a Circle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a {circleName.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Enter the invite code shared by the {circleName.name.toLowerCase()} organiser to join.
                </p>
                <div>
                  <Label>Invite Code</Label>
                  <Input
                    placeholder={`e.g. my-${circleName.name.toLowerCase()}-abc123`}
                    value={joinSlug}
                    onChange={(e) => setJoinSlug(e.target.value)}
                  />
                </div>
                <Button onClick={handleJoin} disabled={joining} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {joining && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Join Circle
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Create New Circle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a {circleName.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Circle Name *</Label>
                  <Input
                    placeholder={`e.g. Family Unity ${circleName.name}`}
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={createForm.type}
                      onValueChange={(v) => setCreateForm({ ...createForm, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {circleName.types?.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={createForm.frequency}
                      onValueChange={(v) => setCreateForm({ ...createForm, frequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contribution Amount *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="100"
                      value={createForm.contributionAmount}
                      onChange={(e) => setCreateForm({ ...createForm, contributionAmount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={createForm.contributionCurrency}
                      onValueChange={(v) => setCreateForm({ ...createForm, contributionCurrency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="KES">KES (KSh)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <Button onClick={handleCreate} disabled={creating} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Circle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : circles.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed border-2 border-gray-200 bg-gradient-to-br from-emerald-50/30 to-amber-50/30">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <PiggyBank className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start Saving Together</h2>
            <p className="text-muted-foreground max-w-md mb-2">
              Start or join a savings circle with friends and family back home.
            </p>
            <p className="text-sm text-muted-foreground/80 max-w-sm mb-8">
              {circleName.plural} are a trusted African tradition — now powered by AfriSpine.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create a Circle
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => setJoinOpen(true)}>
                <Users className="h-4 w-4" />
                Join a Circle
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Circles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((circle) => (
            <Card
              key={circle.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-border/60"
              onClick={() => fetchDetail(circle.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{circle.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={TYPE_COLORS[circle.type] || 'bg-gray-100 text-gray-800'} variant="secondary">
                        {TYPE_LABELS[circle.type] || circle.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {circle.frequency === 'monthly' ? 'Monthly' : 'Weekly'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-emerald-700" />
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pot</p>
                    <p className="text-lg font-bold text-gray-900">
                      {fmtMoney(circle.totalPot, circle.contributionCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="text-lg font-bold text-gray-900">
                      {circle._count?.members || circle.memberCount}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {circle.nextPayoutDate
                      ? `Next payout: ${fmtDateShort(circle.nextPayoutDate)}`
                      : `Cycle ${circle.currentCycle}`}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${circle.status === 'active' ? 'border-emerald-300 text-emerald-700' : ''}`}
                  >
                    {circle.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}