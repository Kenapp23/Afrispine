'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Check, Loader2, Shield, Smartphone,
  Building2, Banknote, RefreshCw, Clock, CreditCard, Lock,
  Mail, User, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useAppStore,
  SOURCE_COUNTRIES,
  DESTINATIONS,
  getCurrencySymbol,
  TRANSFER_REASONS,
  ID_TYPES,
  DELIVERY_METHODS,
  type SendStep,
} from '@/stores/app'

const STEPS: { key: SendStep; label: string }[] = [
  { key: 'corridor', label: 'Corridor' },
  { key: 'quote', label: 'Quote' },
  { key: 'recipient', label: 'Recipient' },
  { key: 'kyc', label: 'Verify' },
  { key: 'payment', label: 'Pay' },
  { key: 'confirmation', label: 'Done' },
]

function StepIndicator() {
  const step = useAppStore(s => s.step)
  const currentIdx = STEPS.findIndex(s => s.key === step)
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
            i < currentIdx
              ? 'bg-primary text-primary-foreground'
              : i === currentIdx
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2'
                : 'bg-muted text-muted-foreground'
          }`}>
            {i < currentIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-0.5 ${i < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ErrorBanner() {
  const error = useAppStore(s => s.error)
  const setError = useAppStore(s => s.setError)
  if (!error) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between mb-4"
    >
      <span>{error}</span>
      <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
    </motion.div>
  )
}

// ── STEP 1: Corridor + Amount ──────────────────────────────────────────
function CorridorStep() {
  const senderCountry = useAppStore(s => s.senderCountry)
  const recvCountry = useAppStore(s => s.recvCountry)
  const sendAmount = useAppStore(s => s.sendAmount)
  const liveFxRate = useAppStore(s => s.liveFxRate)
  const isLoading = useAppStore(s => s.isLoading)
  const setSenderCountry = useAppStore(s => s.setSenderCountry)
  const setRecvCountry = useAppStore(s => s.setRecvCountry)
  const setSendAmount = useAppStore(s => s.setSendAmount)
  const fetchQuote = useAppStore(s => s.fetchQuote)
  const setError = useAppStore(s => s.setError)

  const src = SOURCE_COUNTRIES.find(s => s.code === senderCountry)
  const dst = DESTINATIONS[recvCountry]
  const symbol = src?.symbol || '$'
  const amt = parseFloat(sendAmount) || 0
  const estRecv = liveFxRate ? Math.round(amt * liveFxRate * 100) / 100 : null

  const presets = src?.currency === 'GBP' ? [50, 100, 200, 500] : src?.currency === 'EUR' ? [50, 100, 200, 500] : [50, 100, 200, 500]

  return (
    <motion.div key="corridor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="text-xl font-bold mb-1">Who are you sending to?</h2>
      <p className="text-muted-foreground text-sm mb-6">Choose the corridor and enter how much you want to send.</p>

      {/* Sender Country */}
      <Label className="text-sm font-medium mb-2 block">You send from</Label>
      <div className="flex gap-2 mb-5">
        {SOURCE_COUNTRIES.map(c => (
          <button
            key={c.code}
            onClick={() => { setSenderCountry(c.code); setError(null) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
              senderCountry === c.code
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted bg-background text-foreground hover:border-primary/40'
            }`}
          >
            <span className="text-lg">{c.flag}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Recipient Country */}
      <Label className="text-sm font-medium mb-2 block">Recipient receives in</Label>
      <Select value={recvCountry} onValueChange={(v) => { setRecvCountry(v); setError(null) }}>
        <SelectTrigger className="mb-5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DESTINATIONS).map(([code, d]) => (
            <SelectItem key={code} value={code}>
              {d.flag} {d.name} — {d.tag} ({d.currency})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Amount */}
      <Label className="text-sm font-medium mb-2 block">Amount</Label>
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">{symbol}</span>
        <Input
          type="number"
          value={sendAmount}
          onChange={(e) => { setSendAmount(e.target.value); setError(null) }}
          className="pl-10 text-2xl font-bold h-14"
          placeholder="0.00"
          min="5"
          max="5000"
          step="1"
        />
      </div>
      <div className="flex gap-2 mb-4">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setSendAmount(String(p))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              sendAmount === String(p) ? 'border-primary bg-primary text-primary-foreground' : 'border-muted hover:border-primary/40'
            }`}
          >
            {symbol}{p}
          </button>
        ))}
      </div>

      {/* Live FX Preview */}
      {estRecv && dst && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Recipient gets approximately</p>
          <p className="text-2xl font-bold text-primary">{getCurrencySymbol(dst.currency)} {estRecv.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-sm font-normal text-muted-foreground">{dst.currency}</span></p>
        </div>
      )}

      <Button
        onClick={fetchQuote}
        disabled={isLoading || !sendAmount || parseFloat(sendAmount) < 5}
        className="w-full h-12 text-base font-semibold gap-2"
        size="lg"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        See transfer details <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}

// ── STEP 2: Quote Confirmation ─────────────────────────────────────────
function QuoteStep() {
  const quoteData = useAppStore(s => s.quoteData)
  const quoteSecondsLeft = useAppStore(s => s.quoteSecondsLeft)
  const isLoading = useAppStore(s => s.isLoading)
  const setStep = useAppStore(s => s.setStep)
  const fetchQuote = useAppStore(s => s.fetchQuote)
  const stopQuoteTimer = useAppStore(s => s.stopQuoteTimer)

  if (!quoteData) return null

  const isExpired = quoteSecondsLeft <= 0
  const mins = Math.floor(quoteSecondsLeft / 60)
  const secs = quoteSecondsLeft % 60
  const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`
  const dst = DESTINATIONS[quoteData.sendCurrency ? '' : 'KE']

  const srcSymbol = getCurrencySymbol(quoteData.sendCurrency)
  const recvSymbol = getCurrencySymbol(quoteData.recvCurrency)

  return (
    <motion.div key="quote" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="text-xl font-bold mb-1">Confirm your transfer</h2>
      <p className="text-muted-foreground text-sm mb-6">Review the rate and fees. This rate is locked for 15 minutes.</p>

      <Card className="border-2 border-primary/20 mb-6">
        <CardContent className="p-6 space-y-4">
          {/* You send */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">You send</span>
            <span className="text-xl font-bold">{srcSymbol}{quoteData.sendAmount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{quoteData.sendCurrency}</span></span>
          </div>

          <div className="h-px bg-border" />

          {/* Fee */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">AfriSpine fee ({quoteData.feePct}%)</span>
            <span className="font-medium">{srcSymbol}{quoteData.feeAmount.toFixed(2)}</span>
          </div>

          <div className="h-px bg-border" />

          {/* Recipient gets */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Recipient gets</span>
            <span className="text-xl font-bold text-primary">{recvSymbol} {quoteData.recvAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-sm font-normal">{quoteData.recvCurrency}</span></span>
          </div>

          <div className="h-px bg-border" />

          {/* Rate */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Exchange rate</span>
            <span className="font-mono text-sm">1 {quoteData.sendCurrency} = {quoteData.fxRate.toFixed(2)} {quoteData.recvCurrency}</span>
          </div>

          {/* Timer */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rate locked for</span>
            <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${isExpired ? 'text-red-600' : quoteSecondsLeft < 120 ? 'text-orange-600' : 'text-primary'}`}>
              <Clock className="w-3.5 h-3.5" />
              {isExpired ? 'Expired' : timerStr}
            </div>
          </div>

          {/* Provider + Delivery */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-sm">{quoteData.providerName} · {quoteData.estimatedSpeed}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('corridor')} className="flex-1 gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {isExpired ? (
          <Button onClick={fetchQuote} variant="secondary" className="flex-1 gap-1">
            <RefreshCw className="w-4 h-4" /> Refresh Rate
          </Button>
        ) : (
          <Button onClick={() => setStep('recipient')} className="flex-1 gap-1">
            Accept this rate <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// ── STEP 3: Recipient Details ──────────────────────────────────────────
function RecipientStep() {
  const recipientName = useAppStore(s => s.recipientName)
  const recipientPhone = useAppStore(s => s.recipientPhone)
  const deliveryMethod = useAppStore(s => s.deliveryMethod)
  const reasonForTransfer = useAppStore(s => s.reasonForTransfer)
  const recvCountry = useAppStore(s => s.recvCountry)
  const setRecipientName = useAppStore(s => s.setRecipientName)
  const setRecipientPhone = useAppStore(s => s.setRecipientPhone)
  const setDeliveryMethod = useAppStore(s => s.setDeliveryMethod)
  const setReasonForTransfer = useAppStore(s => s.setReasonForTransfer)
  const submitRecipient = useAppStore(s => s.submitRecipient)
  const setStep = useAppStore(s => s.setStep)
  const setError = useAppStore(s => s.setError)

  const dst = DESTINATIONS[recvCountry]
  const prefix = dst?.prefix || '+254'

  return (
    <motion.div key="recipient" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="text-xl font-bold mb-1">Recipient details</h2>
      <p className="text-muted-foreground text-sm mb-6">Who is receiving the money?</p>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="rname" className="text-sm font-medium">Full name</Label>
          <Input id="rname" placeholder="e.g. John Mwangi" value={recipientName} onChange={e => { setRecipientName(e.target.value); setError(null) }} className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="rphone" className="text-sm font-medium">Phone number</Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">{prefix}</span>
            <Input id="rphone" type="tel" placeholder="712 345 678" value={recipientPhone} onChange={e => { setRecipientPhone(e.target.value); setError(null) }} className="pl-20" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Delivery method</Label>
          <div className="grid grid-cols-3 gap-2">
            {DELIVERY_METHODS.map(m => {
              const icons: Record<string, React.ReactNode> = { mobile_money: <Smartphone className="w-4 h-4" />, bank: <Building2 className="w-4 h-4" />, cash: <Banknote className="w-4 h-4" /> }
              return (
                <button
                  key={m.value}
                  onClick={() => setDeliveryMethod(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                    deliveryMethod === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-muted hover:border-primary/40'
                  }`}
                >
                  {icons[m.value]}
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Reason for transfer <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Select value={reasonForTransfer} onValueChange={setReasonForTransfer}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>
              {TRANSFER_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('quote')} className="flex-1 gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={submitRecipient} className="flex-1 gap-1">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ── STEP 4: KYC Verification ───────────────────────────────────────────
function KycStep() {
  const senderEmail = useAppStore(s => s.senderEmail)
  const senderFullName = useAppStore(s => s.senderFullName)
  const senderDob = useAppStore(s => s.senderDob)
  const senderIdType = useAppStore(s => s.senderIdType)
  const senderIdNumber = useAppStore(s => s.senderIdNumber)
  const kycStatus = useAppStore(s => s.kycStatus)
  const isKycLoading = useAppStore(s => s.isKycLoading)
  const setSenderEmail = useAppStore(s => s.setSenderEmail)
  const setSenderFullName = useAppStore(s => s.setSenderFullName)
  const setSenderDob = useAppStore(s => s.setSenderDob)
  const setSenderIdType = useAppStore(s => s.setSenderIdType)
  const setSenderIdNumber = useAppStore(s => s.setSenderIdNumber)
  const submitKyc = useAppStore(s => s.submitKyc)
  const setStep = useAppStore(s => s.setStep)
  const setError = useAppStore(s => s.setError)
  const checkExistingKyc = useAppStore(s => s.checkExistingKyc)

  useEffect(() => {
    if (senderEmail) checkExistingKyc()
  }, [senderEmail, checkExistingKyc])

  // Auto-advance if already verified
  useEffect(() => {
    if (kycStatus === 'approved' && !isKycLoading) {
      const timer = setTimeout(() => setStep('payment'), 800)
      return () => clearTimeout(timer)
    }
  }, [kycStatus, isKycLoading, setStep])

  return (
    <motion.div key="kyc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="text-xl font-bold mb-1">Verify your identity</h2>
      <p className="text-muted-foreground text-sm mb-6">Required by law before sending money. This only happens once.</p>

      {kycStatus === 'approved' ? (
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-green-700">Verified</p>
          <p className="text-sm text-muted-foreground">Your identity has been verified. Proceeding to payment...</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="kyc-email" className="text-sm font-medium">Email address</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="kyc-email" type="email" placeholder="you@email.com" value={senderEmail} onChange={e => { setSenderEmail(e.target.value); setError(null) }} className="pl-10" />
            </div>
          </div>

          <div>
            <Label htmlFor="kyc-name" className="text-sm font-medium">Full legal name</Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="kyc-name" placeholder="As it appears on your ID" value={senderFullName} onChange={e => { setSenderFullName(e.target.value); setError(null) }} className="pl-10" />
            </div>
          </div>

          <div>
            <Label htmlFor="kyc-dob" className="text-sm font-medium">Date of birth</Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="kyc-dob" type="date" value={senderDob} onChange={e => { setSenderDob(e.target.value); setError(null) }} className="pl-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">ID type</Label>
              <Select value={senderIdType} onValueChange={setSenderIdType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ID_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kyc-idnum" className="text-sm font-medium">ID number</Label>
              <Input id="kyc-idnum" placeholder="ID number" value={senderIdNumber} onChange={e => { setSenderIdNumber(e.target.value); setError(null) }} className="mt-1.5" />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Powered by Smile ID — your data is encrypted and secure. We only share what the regulator requires.</p>
          </div>
        </div>
      )}

      {kycStatus !== 'approved' && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('recipient')} className="flex-1 gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button onClick={submitKyc} disabled={isKycLoading} className="flex-1 gap-1">
            {isKycLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Verify Identity
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// ── STEP 5: Payment ────────────────────────────────────────────────────
function PaymentStep() {
  const quoteData = useAppStore(s => s.quoteData)
  const paymentLoading = useAppStore(s => s.paymentLoading)
  const recipientName = useAppStore(s => s.recipientName)
  const processPayment = useAppStore(s => s.processPayment)
  const setStep = useAppStore(s => s.setStep)
  const setError = useAppStore(s => s.setError)
  const [cardNumber, setCardNumber] = React.useState('')
  const [expiry, setExpiry] = React.useState('')
  const [cvc, setCvc] = React.useState('')

  if (!quoteData) return null
  const total = (quoteData.sendAmount + quoteData.feeAmount).toFixed(2)
  const srcSymbol = getCurrencySymbol(quoteData.sendCurrency)

  const isCardValid = cardNumber.replace(/\s/g, '').length >= 13 && expiry.length >= 4 && cvc.length >= 3

  return (
    <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <h2 className="text-xl font-bold mb-1">Pay {srcSymbol}{total}</h2>
      <p className="text-muted-foreground text-sm mb-6">Complete your payment to send money to {recipientName}.</p>

      {/* Summary */}
      <Card className="mb-6 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Transfer amount</span>
            <span>{srcSymbol}{quoteData.sendAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Fee ({quoteData.feePct}%)</span>
            <span>{srcSymbol}{quoteData.feeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Recipient gets</span>
            <span className="text-primary font-medium">{getCurrencySymbol(quoteData.recvCurrency)} {quoteData.recvAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between font-bold mt-2">
            <span>Total</span>
            <span>{srcSymbol}{total}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card Form */}
      <div className="space-y-4 mb-6">
        <div>
          <Label className="text-sm font-medium">Card number</Label>
          <div className="relative mt-1.5">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value.replace(/[^0-9 ]/g, '').slice(0, 19))}
              className="pl-10 font-mono"
              disabled={paymentLoading}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Expiry</Label>
            <Input placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value.replace(/[^0-9/]/g, '').slice(0, 5))} className="mt-1.5 font-mono" disabled={paymentLoading} />
          </div>
          <div>
            <Label className="text-sm font-medium">CVC</Label>
            <Input placeholder="123" value={cvc} onChange={e => setCvc(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} className="mt-1.5 font-mono" type="password" disabled={paymentLoading} />
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">Your card details are encrypted by Stripe. AfriSpine never stores your card number.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('kyc')} disabled={paymentLoading} className="flex-1 gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={processPayment} disabled={paymentLoading || !isCardValid} className="flex-1 gap-1">
          {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {paymentLoading ? 'Processing...' : `Pay ${srcSymbol}${total}`}
        </Button>
      </div>
    </motion.div>
  )
}

// ── STEP 6: Confirmation ──────────────────────────────────────────────
function ConfirmationStep() {
  const txRef = useAppStore(s => s.txRef)
  const quoteData = useAppStore(s => s.quoteData)
  const recipientName = useAppStore(s => s.recipientName)
  const reset = useAppStore(s => s.reset)

  const srcSymbol = quoteData ? getCurrencySymbol(quoteData.sendCurrency) : '$'
  const recvSymbol = quoteData ? getCurrencySymbol(quoteData.recvCurrency) : ''

  return (
    <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
      <div className="flex flex-col items-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5"
        >
          <Check className="w-10 h-10 text-green-600" />
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Transfer sent!</h2>
        <p className="text-muted-foreground text-center mb-6">Your money is on its way to {recipientName}.</p>

        <Card className="w-full mb-6">
          <CardContent className="p-5 space-y-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reference</p>
              <p className="font-mono text-lg font-bold">{txRef}</p>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sent</span>
              <span className="font-medium">{srcSymbol}{quoteData?.sendAmount.toFixed(2)} {quoteData?.sendCurrency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Received</span>
              <span className="font-medium text-primary">{recvSymbol} {quoteData?.recvAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {quoteData?.recvCurrency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-medium">{quoteData?.estimatedSpeed} via {quoteData?.providerName}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1 gap-1" onClick={() => {}}>
            Track transfer
          </Button>
          <Button className="flex-1 gap-1" onClick={reset}>
            Send another <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Export ────────────────────────────────────────────────────────
export function SendFlowSection() {
  const step = useAppStore(s => s.step)
  const fetchLiveFx = useAppStore(s => s.fetchLiveFx)

  useEffect(() => {
    fetchLiveFx()
  }, [fetchLiveFx])

  return (
    <section id="send" className="py-12 md:py-20">
      <div className="max-w-md mx-auto px-4">
        <StepIndicator />
        <ErrorBanner />
        <AnimatePresence mode="wait">
          {step === 'corridor' && <CorridorStep />}
          {step === 'quote' && <QuoteStep />}
          {step === 'recipient' && <RecipientStep />}
          {step === 'kyc' && <KycStep />}
          {step === 'payment' && <PaymentStep />}
          {step === 'confirmation' && <ConfirmationStep />}
        </AnimatePresence>
      </div>
    </section>
  )
}
