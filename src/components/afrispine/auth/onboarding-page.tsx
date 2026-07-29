'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, Loader2, User, ShieldCheck, Users } from 'lucide-react';

const steps = [
  { key: 'personal', label: 'Personal details', icon: User },
  { key: 'kyc', label: 'Verification', icon: ShieldCheck },
  { key: 'recipient', label: 'Add recipient', icon: Users },
];

export function OnboardingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState({
    fullName: '',
    phone: '',
    country: '',
    dateOfBirth: '',
    address: '',
  });
  const [kyc, setKyc] = useState({
    idType: '',
    idNumber: '',
    idExpiry: '',
  });
  const [recipient, setRecipient] = useState({
    name: '',
    phone: '',
    country: '',
    relationship: '',
  });

  const handlePersonalSubmit = () => {
    if (!personal.fullName || !personal.phone || !personal.country) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(1);
  };

  const handleKycSubmit = async () => {
    if (!kyc.idType || !kyc.idNumber) {
      toast.error('Please fill in your ID details');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    toast.success('Identity verified successfully');
    setStep(2);
  };

  const handleRecipientSubmit = () => {
    if (!recipient.name || !recipient.phone) {
      toast.error('Please fill in recipient details');
      return;
    }
    toast.success('Recipient saved');
    navigate('dashboard');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const StepIcon = s.icon;
            const isDone = i < step;
            const isActive = i === step;
            const circleClass = isDone
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : isActive
              ? 'border-emerald-600 text-emerald-600'
              : 'border-muted-foreground/30 text-muted-foreground';
            const stepContent = isDone
              ? <Check className="h-4 w-4" />
              : <StepIcon className="h-4 w-4" />;
            const connectorClass = i < step ? 'bg-emerald-600' : 'bg-muted-foreground/20';

            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ' + circleClass}>
                    {stepContent}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={'h-0.5 w-8 sm:w-16 transition-colors ' + connectorClass} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Personal details */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal details</CardTitle>
              <CardDescription>Tell us a bit about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    placeholder="+44 7700 000000"
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={personal.dateOfBirth}
                    onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country of residence</Label>
                <Select
                  value={personal.country}
                  onValueChange={(v) => setPersonal({ ...personal, country: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="EU">European Union</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 High Street, London"
                  value={personal.address}
                  onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handlePersonalSubmit}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: KYC Verification */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Identity verification</CardTitle>
              <CardDescription>
                We need to verify your identity to comply with regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID type</Label>
                <Select
                  value={kyc.idType}
                  onValueChange={(v) => setKyc({ ...kyc, idType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's license</SelectItem>
                    <SelectItem value="national_id">National ID card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID number</Label>
                <Input
                  id="idNumber"
                  placeholder="Enter your ID number"
                  value={kyc.idNumber}
                  onChange={(e) => setKyc({ ...kyc, idNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idExpiry">Expiry date</Label>
                <Input
                  id="idExpiry"
                  type="date"
                  value={kyc.idExpiry}
                  onChange={(e) => setKyc({ ...kyc, idExpiry: e.target.value })}
                />
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">
                  Your information is encrypted and processed securely. We use Smile ID
                  for identity verification across Africa.
                </p>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleKycSubmit}
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify identity
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Add first recipient */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Add your first recipient</CardTitle>
              <CardDescription>
                Who would you like to send money to? You can skip this step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient name</Label>
                <Input
                  id="recipientName"
                  placeholder="Jane Doe"
                  value={recipient.name}
                  onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Phone number</Label>
                  <Input
                    id="recipientPhone"
                    placeholder="+254 700 000000"
                    value={recipient.phone}
                    onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient country</Label>
                  <Select
                    value={recipient.country}
                    onValueChange={(v) => setRecipient({ ...recipient, country: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KE">Kenya</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="GH">Ghana</SelectItem>
                      <SelectItem value="TZ">Tanzania</SelectItem>
                      <SelectItem value="UG">Uganda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select
                  value={recipient.relationship}
                  onValueChange={(v) => setRecipient({ ...recipient, relationship: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleRecipientSubmit}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Save and continue
                </Button>
              </div>
              <button
                onClick={() => navigate('dashboard')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
