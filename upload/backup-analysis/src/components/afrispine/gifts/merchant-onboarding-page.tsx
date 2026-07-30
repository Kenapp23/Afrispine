'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowLeft,
  Plus,
  X,
  Star,
  ShieldCheck,
  Store,
  Building2,
  Landmark,
  Smartphone,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  type PayoutMethod,
  type PayoutMethodType,
  generatePayoutId,
  getAvailablePayoutMethods,
  getPayoutMethodLabel,
} from '@/lib/daraja';

// ─── Constants ───────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'NG', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}' },
  { code: 'GH', name: 'Ghana', flag: '\u{1F1EC}\u{1F1ED}' },
  { code: 'ZA', name: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'UG', name: 'Uganda', flag: '\u{1F1FA}\u{1F1EC}' },
  { code: 'TZ', name: 'Tanzania', flag: '\u{1F1F9}\u{1F1FF}' },
] as const;

const BUSINESS_CATEGORIES = [
  'Supermarket',
  'Electronics',
  'Fashion & Apparel',
  'Food & Dining',
  'Healthcare & Pharmacy',
  'Airtime / Telecom',
  'Travel & Hospitality',
  'E-Commerce',
  'Entertainment',
  'Utilities',
  'Services',
  'Other',
] as const;

const POS_TYPES = [
  { value: 'online', label: 'Online / E-Commerce' },
  { value: 'physical', label: 'Physical Store (POS)' },
  { value: 'both', label: 'Both Online & Physical' },
] as const;

const KE_BANKS = [
  'KCB Bank Kenya',
  'Equity Bank Kenya',
  'Co-operative Bank',
  'NCBA Bank',
  'Absa Bank Kenya',
  'Standard Chartered Kenya',
  'Stanbic Bank Kenya',
  'National Bank of Kenya',
  'DTB Bank',
  'I&M Bank',
  'African Banking Corporation',
  'Guaranty Trust Bank Kenya',
  'Habib Bank AG Zurich',
  'Citibank Kenya',
  'Sidian Bank',
  'Spire Bank',
  'Kenya Commercial Bank (KCB)',
  'KCB Group',
] as const;

const NG_BANKS = [
  'GTBank (Guaranty Trust)',
  'Zenith Bank',
  'Access Bank',
  'First Bank of Nigeria',
  'UBA (United Bank for Africa)',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank',
  'Polaris Bank',
  'Keystone Bank',
  'Unity Bank',
  'Titan Trust Bank',
  'Parallex Bank',
  'TajBank',
  'Globus Bank',
] as const;

const MOMO_COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'UG', name: 'Uganda' },
] as const;

const MAX_PAYOUT_METHODS = 3;

// ─── Payout Method Icons ─────────────────────────────────────────

function PayoutMethodIcon({ type }: { type: PayoutMethodType }) {
  switch (type) {
    case 'mpesa_till':
      return <Store className="h-5 w-5 text-green-600" />;
    case 'mpesa_paybill':
      return <Building2 className="h-5 w-5 text-green-600" />;
    case 'bank_ke':
    case 'bank_ng':
      return <Landmark className="h-5 w-5 text-emerald-600" />;
    case 'momo_mtn':
      return <Smartphone className="h-5 w-5 text-yellow-600" />;
  }
}

// ─── Payout Method Card ──────────────────────────────────────────

interface PayoutMethodCardProps {
  method: PayoutMethod;
  index: number;
  onUpdate: (id: string, updates: Partial<PayoutMethod>) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
}

function PayoutMethodCard({
  method,
  index,
  onUpdate,
  onRemove,
  onSetPrimary,
}: PayoutMethodCardProps) {
  const [open, setOpen] = useState(false);

  const update = useCallback(
    (updates: Partial<PayoutMethod>) => {
      onUpdate(method.id, updates);
    },
    [method.id, onUpdate],
  );

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <PayoutMethodIcon type={method.type} />
            </div>
            <div>
              <CardTitle className="text-base">
                {getPayoutMethodLabel(method.type)}
              </CardTitle>
              <CardDescription className="text-xs">
                {method.type === 'mpesa_till' && method.tillNumber
                  ? `Till: ${method.tillNumber}`
                  : method.type === 'mpesa_paybill' && method.paybillNumber
                    ? `Paybill: ${method.paybillNumber}`
                    : method.type === 'bank_ke' && method.bankNameKe
                      ? `${method.bankNameKe}`
                      : method.type === 'bank_ng' && method.bankNameNg
                        ? `${method.bankNameNg}`
                        : method.type === 'momo_mtn' && method.momoNumber
                          ? `MoMo: ${method.momoNumber}`
                          : 'Not configured'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {method.isPrimary ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                Primary
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onSetPrimary(method.id)}
              >
                <Star className="h-3 w-3 mr-1" />
                Set Primary
              </Button>
            )}
            <Badge
              variant={method.verified ? 'default' : 'secondary'}
              className={
                method.verified
                  ? 'bg-emerald-100 text-emerald-700 gap-1'
                  : 'bg-amber-50 text-amber-700 gap-1'
              }
            >
              {method.verified ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  Unverified
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* M-Pesa Till */}
        {method.type === 'mpesa_till' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`till-${index}`} className="text-xs">
                Till Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`till-${index}`}
                placeholder="e.g. 555555"
                value={method.tillNumber ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 7);
                  update({ tillNumber: v });
                }}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`tillname-${index}`} className="text-xs">
                Business Name on Till
              </Label>
              <Input
                id={`tillname-${index}`}
                placeholder="Registered business name"
                value={method.tillBusinessName ?? ''}
                onChange={(e) => update({ tillBusinessName: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* M-Pesa Paybill */}
        {method.type === 'mpesa_paybill' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`paybill-${index}`} className="text-xs">
                Paybill Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`paybill-${index}`}
                placeholder="6-digit paybill"
                value={method.paybillNumber ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                  update({ paybillNumber: v });
                }}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`acctref-${index}`} className="text-xs">
                Account Reference
              </Label>
              <Input
                id={`acctref-${index}`}
                placeholder="e.g. ACC12345"
                value={method.accountReference ?? ''}
                onChange={(e) => update({ accountReference: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* Kenyan Bank */}
        {method.type === 'bank_ke' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name <span className="text-red-500">*</span></Label>
              <Select
                value={method.bankNameKe ?? ''}
                onValueChange={(v) => update({ bankNameKe: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {KE_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.accountNameKe ?? ''}
                onChange={(e) => update({ accountNameKe: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 0123456789"
                value={method.accountNumberKe ?? ''}
                onChange={(e) =>
                  update({ accountNumberKe: e.target.value.replace(/\D/g, '') })
                }
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Branch Code</Label>
              <Input
                placeholder="e.g. 01"
                value={method.branchCodeKe ?? ''}
                onChange={(e) =>
                  update({ branchCodeKe: e.target.value.replace(/\D/g, '') })
                }
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* Nigerian Bank */}
        {method.type === 'bank_ng' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name <span className="text-red-500">*</span></Label>
              <Select
                value={method.bankNameNg ?? ''}
                onValueChange={(v) => update({ bankNameNg: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {NG_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Account Number (NUBAN) <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="10-digit NUBAN"
                value={method.accountNumberNg ?? ''}
                onChange={(e) =>
                  update({
                    accountNumberNg: e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10),
                  })
                }
                className="h-9 text-sm"
                maxLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name</Label>
              <div className="relative">
                <Input
                  placeholder="Auto-verified on submission"
                  value={method.accountNameNg ?? ''}
                  onChange={(e) => update({ accountNameNg: e.target.value })}
                  className="h-9 text-sm pr-20"
                  readOnly
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-600 font-medium">
                  Auto-verify
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MTN MoMo */}
        {method.type === 'momo_mtn' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">MoMo Business Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 256771234567"
                value={method.momoNumber ?? ''}
                onChange={(e) => update({ momoNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Select
                value={method.momoCountry ?? method.country ?? ''}
                onValueChange={(v) => update({ momoCountry: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {MOMO_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Remove button */}
        <div className="mt-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs">
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Payout Method?</DialogTitle>
                <DialogDescription>
                  This will remove {getPayoutMethodLabel(method.type)} from your
                  payout methods. You can always add it back later.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onRemove(method.id);
                    setOpen(false);
                    toast.success('Payout method removed');
                  }}
                >
                  Remove
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Add Payout Method Dialog ────────────────────────────────────

interface AddPayoutDialogProps {
  country: string;
  availableTypes: PayoutMethodType[];
  onAdd: (type: PayoutMethodType) => void;
  disabled: boolean;
}

function AddPayoutDialog({
  country,
  availableTypes,
  onAdd,
  disabled,
}: AddPayoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PayoutMethodType | null>(null);

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected);
    setSelected(null);
    setOpen(false);
  };

  if (availableTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Info className="h-8 w-8 mb-2" />
        <p className="text-sm">
          No payout methods available for {COUNTRIES.find((c) => c.code === country)?.name ?? country}.
        </p>
        <p className="text-xs mt-1">
          Select Kenya, Nigeria, Ghana, or Uganda to see available options.
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-dashed border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 w-full h-12"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payout Method
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payout Method</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to receive voucher redemption payouts.
            You can add up to {MAX_PAYOUT_METHODS} methods.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(type)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                selected === type
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  selected === type ? 'bg-emerald-100' : 'bg-gray-100'
                }`}
              >
                <PayoutMethodIcon type={type} />
              </div>
              <div>
                <p className="text-sm font-medium">{getPayoutMethodLabel(type)}</p>
                <p className="text-xs text-muted-foreground">
                  {type === 'mpesa_till' && 'Receive payouts directly to your M-Pesa Till'}
                  {type === 'mpesa_paybill' && 'Receive payouts via Paybill number'}
                  {type === 'bank_ke' && 'Settle to a Kenyan bank account'}
                  {type === 'bank_ng' && 'Settle to a Nigerian bank account (NUBAN)'}
                  {type === 'momo_mtn' && 'Receive payouts via MTN Mobile Money'}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!selected}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Add Method
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export function MerchantOnboardingPage() {
  const navigate = useAppStore((s) => s.navigate);

  // ── Business Info State ──
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [country, setCountry] = useState('KE');
  const [category, setCategory] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [posType, setPosType] = useState('online');

  // ── Payout Methods State ──
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);

  // ── Commission ──
  const [commissionPct] = useState(2);

  // ── UI State ──
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Computed ──
  const availableTypes = useMemo(
    () => getAvailablePayoutMethods(country),
    [country],
  );

  const canAddMore = payoutMethods.length < MAX_PAYOUT_METHODS;

  // ── Payout Method Handlers ──
  const addPayoutMethod = useCallback(
    (type: PayoutMethodType) => {
      const method: PayoutMethod = {
        id: generatePayoutId(),
        type,
        country,
        isPrimary: payoutMethods.length === 0,
        verified: false,
        momoCountry: type === 'momo_mtn' ? country : undefined,
      };
      setPayoutMethods((prev) => [...prev, method]);
      toast.success(`${getPayoutMethodLabel(type)} added`);
    },
    [country, payoutMethods.length],
  );

  const updatePayoutMethod = useCallback(
    (id: string, updates: Partial<PayoutMethod>) => {
      setPayoutMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
    },
    [],
  );

  const removePayoutMethod = useCallback((id: string) => {
    setPayoutMethods((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      // If we removed the primary, promote the first one
      if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  }, []);

  const setPrimaryPayoutMethod = useCallback((id: string) => {
    setPayoutMethods((prev) =>
      prev.map((m) => ({ ...m, isPrimary: m.id === id })),
    );
  }, []);

  // Reset payout methods when country changes
  const handleCountryChange = useCallback((newCountry: string) => {
    setCountry(newCountry);
    // Only clear methods that are no longer available
    const newAvailable = getAvailablePayoutMethods(newCountry);
    setPayoutMethods((prev) => {
      const kept = prev.filter((m) => newAvailable.includes(m.type));
      // Promote primary if needed
      if (!kept.some((m) => m.isPrimary) && kept.length > 0) {
        kept[0].isPrimary = true;
      }
      return kept;
    });
  }, []);

  // ── Validation ──
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};

    if (!businessName.trim()) e.businessName = 'Business name is required';
    if (!registrationNumber.trim()) e.registrationNumber = 'Registration number is required';
    if (!category) e.category = 'Please select a category';
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      e.contactEmail = 'Valid email is required';
    }
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (payoutMethods.length === 0) {
      e.payoutMethods = 'Add at least one payout method';
    }

    // Validate each payout method has required fields
    payoutMethods.forEach((m, i) => {
      const prefix = `payout_${i}`;
      switch (m.type) {
        case 'mpesa_till':
          if (!m.tillNumber || m.tillNumber.length < 5) {
            e[`${prefix}_till`] = 'Till number must be 5-7 digits';
          }
          break;
        case 'mpesa_paybill':
          if (!m.paybillNumber || m.paybillNumber.length !== 6) {
            e[`${prefix}_paybill`] = 'Paybill number must be 6 digits';
          }
          break;
        case 'bank_ke':
          if (!m.bankNameKe) e[`${prefix}_bank`] = 'Select a bank';
          if (!m.accountNameKe) e[`${prefix}_name`] = 'Account name is required';
          if (!m.accountNumberKe) e[`${prefix}_acct`] = 'Account number is required';
          break;
        case 'bank_ng':
          if (!m.bankNameNg) e[`${prefix}_bank`] = 'Select a bank';
          if (!m.accountNumberNg || m.accountNumberNg.length !== 10) {
            e[`${prefix}_acct`] = 'NUBAN must be 10 digits';
          }
          break;
        case 'momo_mtn':
          if (!m.momoNumber) e[`${prefix}_momo`] = 'MoMo number is required';
          break;
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [businessName, registrationNumber, category, contactEmail, phone, payoutMethods]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/merchants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          registrationNumber,
          country,
          category,
          contactEmail,
          phone,
          posType,
          payoutMethods: payoutMethods.map((m) => ({
            type: m.type,
            country: m.country,
            isPrimary: m.isPrimary,
            verified: m.verified,
            tillNumber: m.tillNumber,
            tillBusinessName: m.tillBusinessName,
            paybillNumber: m.paybillNumber,
            accountReference: m.accountReference,
            bankNameKe: m.bankNameKe,
            accountNameKe: m.accountNameKe,
            accountNumberKe: m.accountNumberKe,
            branchCodeKe: m.branchCodeKe,
            bankNameNg: m.bankNameNg,
            accountNumberNg: m.accountNumberNg,
            accountNameNg: m.accountNameNg,
            momoNumber: m.momoNumber,
            momoCountry: m.momoCountry,
          })),
          commissionPct,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [
    businessName,
    registrationNumber,
    country,
    category,
    contactEmail,
    phone,
    posType,
    payoutMethods,
    commissionPct,
    validate,
  ]);

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Application Received!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Thank you for registering as an AfriSpine gift voucher merchant.
              Our team will review your application and verify your payout methods
              within 1-2 business days. You&apos;ll receive a confirmation email at{' '}
              <span className="font-medium text-foreground">{contactEmail}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('gifts')}
              >
                Back to Gifts
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setSubmitted(false);
                  setBusinessName('');
                  setRegistrationNumber('');
                  setCountry('KE');
                  setCategory('');
                  setContactEmail('');
                  setPhone('');
                  setPosType('online');
                  setPayoutMethods([]);
                }}
              >
                Register Another Merchant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('gifts')}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Gifts Hub
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Merchant Payout Onboarding
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Register your business to accept AfriSpine gift voucher redemptions and
          receive payouts directly to your preferred accounts.
        </p>
      </div>

      {/* ─── Section 1: Business Information ─── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
            1
          </div>
          <h2 className="text-lg font-semibold">Business Information</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="space-y-1.5">
                <Label htmlFor="biz-name">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="biz-name"
                  placeholder="e.g. Green Grocers Ltd"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (errors.businessName) setErrors((p) => ({ ...p, businessName: '' }));
                  }}
                  className={errors.businessName ? 'border-red-400' : ''}
                />
                {errors.businessName && (
                  <p className="text-xs text-red-500">{errors.businessName}</p>
                )}
              </div>

              {/* Registration Number */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-number">
                  Registration Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reg-number"
                  placeholder="e.g. PVT-ABC123X"
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value);
                    if (errors.registrationNumber)
                      setErrors((p) => ({ ...p, registrationNumber: '' }));
                  }}
                  className={errors.registrationNumber ? 'border-red-400' : ''}
                />
                {errors.registrationNumber && (
                  <p className="text-xs text-red-500">{errors.registrationNumber}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label>Country <span className="text-red-500">*</span></Label>
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label>
                  Business Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    if (errors.category) setErrors((p) => ({ ...p, category: '' }));
                  }}
                >
                  <SelectTrigger className={errors.category ? 'border-red-400' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-500">{errors.category}</p>
                )}
              </div>

              {/* Contact Email */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="finance@business.com"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    if (errors.contactEmail)
                      setErrors((p) => ({ ...p, contactEmail: '' }));
                  }}
                  className={errors.contactEmail ? 'border-red-400' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-xs text-red-500">{errors.contactEmail}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="+254 700 123 456"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((p) => ({ ...p, phone: '' }));
                  }}
                  className={errors.phone ? 'border-red-400' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* POS Type */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>POS / Sales Channel</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {POS_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setPosType(pt.value)}
                      className={`p-3 rounded-lg border-2 text-sm text-left transition-colors ${
                        posType === pt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-emerald-300 text-muted-foreground'
                      }`}
                    >
                      <span className="font-medium">{pt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── Section 2: Payout Methods ─── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
            2
          </div>
          <h2 className="text-lg font-semibold">Payout Methods</h2>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              How would you like to receive voucher redemption payouts?
            </CardTitle>
            <CardDescription className="text-xs">
              Add up to {MAX_PAYOUT_METHODS} payout methods. One must be marked as
              primary. All methods start as unverified and will be confirmed by our
              team during review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payout method cards */}
            {payoutMethods.map((method, i) => (
              <PayoutMethodCard
                key={method.id}
                method={method}
                index={i}
                onUpdate={updatePayoutMethod}
                onRemove={removePayoutMethod}
                onSetPrimary={setPrimaryPayoutMethod}
              />
            ))}

            {/* Error */}
            {errors.payoutMethods && (
              <p className="text-xs text-red-500">{errors.payoutMethods}</p>
            )}

            {/* Add button */}
            {canAddMore && (
              <AddPayoutDialog
                country={country}
                availableTypes={availableTypes.filter(
                  (t) => !payoutMethods.some((m) => m.type === t),
                )}
                onAdd={addPayoutMethod}
                disabled={!canAddMore}
              />
            )}

            {payoutMethods.length >= MAX_PAYOUT_METHODS && (
              <p className="text-xs text-muted-foreground text-center py-2">
                You&apos;ve reached the maximum of {MAX_PAYOUT_METHODS} payout methods.
                Remove one to add a different type.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─── Section 3: Commission ─── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
            3
          </div>
          <h2 className="text-lg font-semibold">Commission</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <span className="text-xl font-bold text-emerald-700">
                    {commissionPct}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Default Commission Rate</p>
                  <p className="text-xs text-muted-foreground">
                    Applied to each gift voucher redeemed at your business
                  </p>
                </div>
              </div>
              <div className="sm:ml-auto">
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-gray-50 rounded-lg p-3 max-w-sm">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  <p>
                    AfriSpine retains {commissionPct}% of each voucher face value as
                    our platform fee. You receive {100 - commissionPct}% directly to
                    your primary payout method. Payouts are processed weekly on
                    Mondays for the prior week&apos;s redemptions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── Section 4: Submit ─── */}
      <section className="mb-12">
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Ready to start accepting gift vouchers?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  By submitting, you agree to our{' '}
                  <button
                    type="button"
                    className="text-emerald-600 hover:underline"
                    onClick={() => navigate('terms')}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    className="text-emerald-600 hover:underline"
                    onClick={() => navigate('privacy')}
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}