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
  Globe,
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
  { code: 'SN', name: 'Senegal', flag: '\u{1F1F8}\u{1F1F3}' },
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

// ─── Payout Option Config ──────────────────────────────────────────

interface PayoutOption {
  type: PayoutMethodType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: 'store' | 'building' | 'landmark' | 'smartphone';
}

const PAYOUT_OPTIONS: Record<PayoutMethodType, PayoutOption> = {
  mpesa_till:    { type: 'mpesa_till',    label: 'M-Pesa Till Payment',          description: 'Receive payouts directly to your M-Pesa Till',            color: 'text-green-600',  bgColor: 'bg-green-50',  icon: 'store' },
  mpesa_paybill: { type: 'mpesa_paybill', label: 'M-Pesa Paybill (Buy Goods)',   description: 'Receive payouts via Paybill number',                     color: 'text-green-600',  bgColor: 'bg-green-50',  icon: 'building' },
  bank_ke:       { type: 'bank_ke',       label: 'Kenyan Bank Transfer',         description: 'Settle to a Kenyan bank account',                       color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: 'landmark' },
  bank_ng:       { type: 'bank_ng',       label: 'Bank Transfer (NGN)',          description: 'Settle to a Nigerian bank account (NUBAN)',             color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: 'landmark' },
  opay:          { type: 'opay',          label: 'OPay',                         description: 'Receive payouts to your OPay merchant wallet',          color: 'text-green-600',  bgColor: 'bg-green-50',  icon: 'smartphone' },
  palm_pay:      { type: 'palm_pay',      label: 'PalmPay',                      description: 'Receive payouts to your PalmPay merchant account',       color: 'text-teal-600',   bgColor: 'bg-teal-50',   icon: 'smartphone' },
  momo_mtn:      { type: 'momo_mtn',      label: 'Mobile Money (MTN/Vodafone Cash)', description: 'Receive payouts via MTN or Vodafone Cash',            color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: 'smartphone' },
  bank_gh:       { type: 'bank_gh',       label: 'Bank Transfer (GHS)',          description: 'Settle to a Ghanaian bank account',                      color: 'text-amber-600',  bgColor: 'bg-amber-50',  icon: 'landmark' },
  paystack:      { type: 'paystack',      label: 'Paystack Direct',              description: 'Receive payouts via Paystack to your bank',             color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: 'building' },
  eft_za:        { type: 'eft_za',        label: 'EFT / Bank Transfer (ZAR)',    description: 'Settle to a South African bank via EFT',                color: 'text-green-600',  bgColor: 'bg-green-50',  icon: 'landmark' },
  payfast:       { type: 'payfast',       label: 'PayFast',                      description: 'Receive payouts via PayFast gateway',                   color: 'text-red-600',    bgColor: 'bg-red-50',    icon: 'building' },
  ozow:          { type: 'ozow',          label: 'Ozow',                         description: 'Receive payouts via Ozow EFT',                   color: 'text-cyan-600',   bgColor: 'bg-cyan-50',   icon: 'smartphone' },
  airtel_money:  { type: 'airtel_money',  label: 'Airtel Money',                 description: 'Receive payouts via Airtel Money',                      color: 'text-red-600',    bgColor: 'bg-red-50',    icon: 'smartphone' },
  bank_ug:       { type: 'bank_ug',       label: 'Bank Transfer (UGX)',          description: 'Settle to a Ugandan bank account',                      color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: 'landmark' },
  mpesa_tz:      { type: 'mpesa_tz',      label: 'M-Pesa Tanzania',              description: 'Receive payouts via M-Pesa Tanzania',                  color: 'text-green-600',  bgColor: 'bg-green-50',  icon: 'smartphone' },
  tigo_pesa:     { type: 'tigo_pesa',     label: 'Tigo Pesa',                    description: 'Receive payouts via Tigo Pesa wallet',                 color: 'text-teal-600',   bgColor: 'bg-teal-50',   icon: 'smartphone' },
  crdb_bank:     { type: 'crdb_bank',     label: 'CRDB Bank Transfer',           description: 'Settle to a CRDB bank account',                         color: 'text-green-600',  bgColor: 'bg-green-50',  icon: 'landmark' },
  orange_money:  { type: 'orange_money',  label: 'Orange Money',                 description: 'Receive payouts via Orange Money',                     color: 'text-orange-600', bgColor: 'bg-orange-50', icon: 'smartphone' },
  wave:          { type: 'wave',          label: 'Wave',                         description: 'Receive payouts via Wave wallet',                       color: 'text-cyan-600',   bgColor: 'bg-cyan-50',   icon: 'smartphone' },
  bank_sn:       { type: 'bank_sn',       label: 'Bank Transfer (XOF)',          description: 'Settle to a Senegalese bank account',                   color: 'text-orange-600', bgColor: 'bg-orange-50', icon: 'landmark' },
};

function getCountryPayoutOptions(country: string): PayoutOption[] {
  const types = getAvailablePayoutMethods(country);
  return types.map((t) => PAYOUT_OPTIONS[t]);
}

// ─── Payout Method Icons ─────────────────────────────────────────

function PayoutMethodIcon({ type, className }: { type: PayoutMethodType; className?: string }) {
  const cls = className ?? 'h-5 w-5';
  const opt = PAYOUT_OPTIONS[type];
  switch (opt.icon) {
    case 'store':
      return <Store className={`${cls} ${opt.color}`} />;
    case 'building':
      return <Building2 className={`${cls} ${opt.color}`} />;
    case 'landmark':
      return <Landmark className={`${cls} ${opt.color}`} />;
    case 'smartphone':
      return <Smartphone className={`${cls} ${opt.color}`} />;
  }
}

// ─── Payout Method Summary ───────────────────────────────────────

function getMethodSummary(method: PayoutMethod): string {
  switch (method.type) {
    case 'mpesa_till':     return method.tillNumber ? `Till: ${method.tillNumber}` : '';
    case 'mpesa_paybill':  return method.paybillNumber ? `Paybill: ${method.paybillNumber}` : '';
    case 'bank_ke':        return method.bankNameKe ?? '';
    case 'bank_ng':        return method.bankNameNg ?? '';
    case 'momo_mtn':       return method.momoNumber ? `MoMo: ${method.momoNumber}` : '';
    case 'opay':           return method.opayMerchantNumber ? `OPay: ${method.opayMerchantNumber}` : '';
    case 'palm_pay':       return method.palmPayMerchantId ? `PalmPay: ${method.palmPayMerchantId}` : '';
    case 'bank_gh':        return method.bankNameGh ?? '';
    case 'paystack':       return method.paystackEmail ?? '';
    case 'eft_za':         return method.bankNameZa ?? '';
    case 'payfast':        return method.payfastMerchantId ? `PayFast: ${method.payfastMerchantId}` : '';
    case 'ozow':           return method.ozowBankId ? `Ozow: ${method.ozowBankId}` : '';
    case 'airtel_money':   return method.airtelNumber ? `Airtel: ${method.airtelNumber}` : '';
    case 'bank_ug':        return method.bankNameUg ?? '';
    case 'mpesa_tz':       return method.mpesaTzNumber ? `M-Pesa: ${method.mpesaTzNumber}` : '';
    case 'tigo_pesa':      return method.tigoPesaNumber ? `Tigo: ${method.tigoPesaNumber}` : '';
    case 'crdb_bank':      return method.crdbAccountNumber ? `CRDB: ${method.crdbAccountNumber}` : '';
    case 'orange_money':   return method.orangeMoneyNumber ? `Orange: ${method.orangeMoneyNumber}` : '';
    case 'wave':           return method.waveNumber ? `Wave: ${method.waveNumber}` : '';
    case 'bank_sn':        return method.bankNameSn ?? '';
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
  const opt = PAYOUT_OPTIONS[method.type];

  const update = useCallback(
    (updates: Partial<PayoutMethod>) => {
      onUpdate(method.id, updates);
    },
    [method.id, onUpdate],
  );

  const summary = getMethodSummary(method);

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${opt.bgColor}`}>
              <PayoutMethodIcon type={method.type} />
            </div>
            <div>
              <CardTitle className="text-base">
                {getPayoutMethodLabel(method.type)}
              </CardTitle>
              <CardDescription className="text-xs">
                {summary || 'Not configured'}
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
        {/* ── M-Pesa Till ── */}
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

        {/* ── M-Pesa Paybill ── */}
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

        {/* ── Kenyan Bank ── */}
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

        {/* ── Nigerian Bank ── */}
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

        {/* ── MTN MoMo ── */}
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

        {/* ── OPay ── */}
        {method.type === 'opay' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">OPay Merchant Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. OPay merchant number"
                value={method.opayMerchantNumber ?? ''}
                onChange={(e) => update({ opayMerchantNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── PalmPay ── */}
        {method.type === 'palm_pay' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">PalmPay Merchant ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. PalmPay merchant ID"
                value={method.palmPayMerchantId ?? ''}
                onChange={(e) => update({ palmPayMerchantId: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Ghana Bank ── */}
        {method.type === 'bank_gh' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. GCB Bank, Ecobank Ghana"
                value={method.bankNameGh ?? ''}
                onChange={(e) => update({ bankNameGh: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 1234567890"
                value={method.accountNumberGh ?? ''}
                onChange={(e) => update({ accountNumberGh: e.target.value.replace(/\D/g, '') })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.accountNameGh ?? ''}
                onChange={(e) => update({ accountNameGh: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Paystack Direct ── */}
        {method.type === 'paystack' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Paystack Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                placeholder="finance@business.com"
                value={method.paystackEmail ?? ''}
                onChange={(e) => update({ paystackEmail: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── SA EFT ── */}
        {method.type === 'eft_za' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. FNB, Standard Bank"
                value={method.bankNameZa ?? ''}
                onChange={(e) => update({ bankNameZa: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 1234567890"
                value={method.accountNumberZa ?? ''}
                onChange={(e) => update({ accountNumberZa: e.target.value.replace(/\D/g, '') })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.accountNameZa ?? ''}
                onChange={(e) => update({ accountNameZa: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Branch Code</Label>
              <Input
                placeholder="e.g. 250655"
                value={method.branchCodeZa ?? ''}
                onChange={(e) => update({ branchCodeZa: e.target.value.replace(/\D/g, '') })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── PayFast ── */}
        {method.type === 'payfast' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">PayFast Merchant ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 10000100"
                value={method.payfastMerchantId ?? ''}
                onChange={(e) => update({ payfastMerchantId: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">PayFast Email</Label>
              <Input
                type="email"
                placeholder="payfast@business.com"
                value={method.payfastEmail ?? ''}
                onChange={(e) => update({ payfastEmail: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Ozow ── */}
        {method.type === 'ozow' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Ozow Bank ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. ABSA001"
                value={method.ozowBankId ?? ''}
                onChange={(e) => update({ ozowBankId: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 4012345678"
                value={method.ozowAccountNumber ?? ''}
                onChange={(e) => update({ ozowAccountNumber: e.target.value.replace(/\D/g, '') })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.ozowAccountName ?? ''}
                onChange={(e) => update({ ozowAccountName: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Airtel Money ── */}
        {method.type === 'airtel_money' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Airtel Money Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 256701234567"
                value={method.airtelNumber ?? ''}
                onChange={(e) => update({ airtelNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Uganda Bank ── */}
        {method.type === 'bank_ug' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Stanbic Bank Uganda"
                value={method.bankNameUg ?? ''}
                onChange={(e) => update({ bankNameUg: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 1234567890"
                value={method.accountNumberUg ?? ''}
                onChange={(e) => update({ accountNumberUg: e.target.value.replace(/\D/g, '') })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.accountNameUg ?? ''}
                onChange={(e) => update({ accountNameUg: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── M-Pesa Tanzania ── */}
        {method.type === 'mpesa_tz' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">M-Pesa Phone Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 255712345678"
                value={method.mpesaTzNumber ?? ''}
                onChange={(e) => update({ mpesaTzNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Business Name</Label>
              <Input
                placeholder="Registered business name"
                value={method.mpesaTzBusinessName ?? ''}
                onChange={(e) => update({ mpesaTzBusinessName: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Tigo Pesa ── */}
        {method.type === 'tigo_pesa' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tigo Pesa Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 255713456789"
                value={method.tigoPesaNumber ?? ''}
                onChange={(e) => update({ tigoPesaNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── CRDB Bank ── */}
        {method.type === 'crdb_bank' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 01J0012345678"
                value={method.crdbAccountNumber ?? ''}
                onChange={(e) => update({ crdbAccountNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.crdbAccountName ?? ''}
                onChange={(e) => update({ crdbAccountName: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Branch Code</Label>
              <Input
                placeholder="e.g. KCM001"
                value={method.crdbBranchCode ?? ''}
                onChange={(e) => update({ crdbBranchCode: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Orange Money ── */}
        {method.type === 'orange_money' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Orange Money Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 221771234567"
                value={method.orangeMoneyNumber ?? ''}
                onChange={(e) => update({ orangeMoneyNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Wave ── */}
        {method.type === 'wave' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Wave Phone Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 221781234567"
                value={method.waveNumber ?? ''}
                onChange={(e) => update({ waveNumber: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Business Name</Label>
              <Input
                placeholder="Registered business name"
                value={method.waveBusinessName ?? ''}
                onChange={(e) => update({ waveBusinessName: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Senegal Bank ── */}
        {method.type === 'bank_sn' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Bank Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. BICIS, BOA Senegal"
                value={method.bankNameSn ?? ''}
                onChange={(e) => update({ bankNameSn: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Number <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. 00123456789"
                value={method.accountNumberSn ?? ''}
                onChange={(e) => update({ accountNumberSn: e.target.value.replace(/\D/g, '') })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Account holder name"
                value={method.accountNameSn ?? ''}
                onChange={(e) => update({ accountNameSn: e.target.value })}
                className="h-9 text-sm"
              />
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
  availableOptions: PayoutOption[];
  onAdd: (type: PayoutMethodType) => void;
  disabled: boolean;
}

function AddPayoutDialog({
  country,
  availableOptions,
  onAdd,
  disabled,
}: AddPayoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PayoutOption | null>(null);

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected.type);
    setSelected(null);
    setOpen(false);
  };

  if (availableOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <Info className="h-8 w-8 mb-2" />
        <p className="text-sm">
          No payout methods available for {COUNTRIES.find((c) => c.code === country)?.name ?? country}.
        </p>
        <p className="text-xs mt-1">
          Select a supported country to see available payout options.
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
          {availableOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => setSelected(option)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                selected?.type === option.type
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  selected?.type === option.type ? option.bgColor : 'bg-gray-100'
                }`}
              >
                <PayoutMethodIcon type={option.type} />
              </div>
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {option.description}
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
  const availableOptions = useMemo(
    () => getCountryPayoutOptions(country),
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

  // Reset ALL payout methods when country changes
  const handleCountryChange = useCallback((newCountry: string) => {
    setCountry(newCountry);
    setPayoutMethods([]);
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
        case 'opay':
          if (!m.opayMerchantNumber) e[`${prefix}_opay`] = 'OPay merchant number is required';
          break;
        case 'palm_pay':
          if (!m.palmPayMerchantId) e[`${prefix}_palm`] = 'PalmPay merchant ID is required';
          break;
        case 'bank_gh':
          if (!m.bankNameGh) e[`${prefix}_bank`] = 'Bank name is required';
          if (!m.accountNumberGh) e[`${prefix}_acct`] = 'Account number is required';
          if (!m.accountNameGh) e[`${prefix}_name`] = 'Account name is required';
          break;
        case 'paystack':
          if (!m.paystackEmail) e[`${prefix}_paystack`] = 'Paystack email is required';
          break;
        case 'eft_za':
          if (!m.bankNameZa) e[`${prefix}_bank`] = 'Bank name is required';
          if (!m.accountNumberZa) e[`${prefix}_acct`] = 'Account number is required';
          if (!m.accountNameZa) e[`${prefix}_name`] = 'Account name is required';
          break;
        case 'payfast':
          if (!m.payfastMerchantId) e[`${prefix}_payfast`] = 'PayFast merchant ID is required';
          break;
        case 'ozow':
          if (!m.ozowBankId) e[`${prefix}_ozow`] = 'Ozow bank ID is required';
          if (!m.ozowAccountNumber) e[`${prefix}_acct`] = 'Account number is required';
          if (!m.ozowAccountName) e[`${prefix}_name`] = 'Account name is required';
          break;
        case 'airtel_money':
          if (!m.airtelNumber) e[`${prefix}_airtel`] = 'Airtel Money number is required';
          break;
        case 'bank_ug':
          if (!m.bankNameUg) e[`${prefix}_bank`] = 'Bank name is required';
          if (!m.accountNumberUg) e[`${prefix}_acct`] = 'Account number is required';
          if (!m.accountNameUg) e[`${prefix}_name`] = 'Account name is required';
          break;
        case 'mpesa_tz':
          if (!m.mpesaTzNumber) e[`${prefix}_mpesa_tz`] = 'M-Pesa number is required';
          break;
        case 'tigo_pesa':
          if (!m.tigoPesaNumber) e[`${prefix}_tigo`] = 'Tigo Pesa number is required';
          break;
        case 'crdb_bank':
          if (!m.crdbAccountNumber) e[`${prefix}_acct`] = 'Account number is required';
          if (!m.crdbAccountName) e[`${prefix}_name`] = 'Account name is required';
          break;
        case 'orange_money':
          if (!m.orangeMoneyNumber) e[`${prefix}_orange`] = 'Orange Money number is required';
          break;
        case 'wave':
          if (!m.waveNumber) e[`${prefix}_wave`] = 'Wave number is required';
          break;
        case 'bank_sn':
          if (!m.bankNameSn) e[`${prefix}_bank`] = 'Bank name is required';
          if (!m.accountNumberSn) e[`${prefix}_acct`] = 'Account number is required';
          if (!m.accountNameSn) e[`${prefix}_name`] = 'Account name is required';
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
            opayMerchantNumber: m.opayMerchantNumber,
            palmPayMerchantId: m.palmPayMerchantId,
            bankNameGh: m.bankNameGh,
            accountNumberGh: m.accountNumberGh,
            accountNameGh: m.accountNameGh,
            paystackEmail: m.paystackEmail,
            bankNameZa: m.bankNameZa,
            accountNumberZa: m.accountNumberZa,
            accountNameZa: m.accountNameZa,
            branchCodeZa: m.branchCodeZa,
            payfastMerchantId: m.payfastMerchantId,
            payfastEmail: m.payfastEmail,
            ozowBankId: m.ozowBankId,
            ozowAccountNumber: m.ozowAccountNumber,
            ozowAccountName: m.ozowAccountName,
            airtelNumber: m.airtelNumber,
            bankNameUg: m.bankNameUg,
            accountNumberUg: m.accountNumberUg,
            accountNameUg: m.accountNameUg,
            mpesaTzNumber: m.mpesaTzNumber,
            mpesaTzBusinessName: m.mpesaTzBusinessName,
            tigoPesaNumber: m.tigoPesaNumber,
            crdbAccountNumber: m.crdbAccountNumber,
            crdbAccountName: m.crdbAccountName,
            crdbBranchCode: m.crdbBranchCode,
            orangeMoneyNumber: m.orangeMoneyNumber,
            waveNumber: m.waveNumber,
            waveBusinessName: m.waveBusinessName,
            bankNameSn: m.bankNameSn,
            accountNumberSn: m.accountNumberSn,
            accountNameSn: m.accountNameSn,
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

      {/* ─── Country Selector ─── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-lg font-semibold">Operating Country</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    if (country !== c.code) {
                      handleCountryChange(c.code);
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-lg border-2 text-sm text-center transition-colors ${
                    country === c.code
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-emerald-300 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="font-medium text-xs leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <p>
                Select your operating country to see available payout methods.
                Changing the country will reset your selected payout methods.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

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

              {/* Country (read-only indicator in form) */}
              <div className="space-y-1.5">
                <Label>Country</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50 text-sm">
                  <span>{COUNTRIES.find((c) => c.code === country)?.flag}</span>
                  <span className="text-muted-foreground">{COUNTRIES.find((c) => c.code === country)?.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">({country})</span>
                </div>
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
          <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
            {COUNTRIES.find((c) => c.code === country)?.flag} {COUNTRIES.find((c) => c.code === country)?.name}
          </Badge>
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
                availableOptions={availableOptions.filter(
                  (opt) => !payoutMethods.some((m) => m.type === opt.type),
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
