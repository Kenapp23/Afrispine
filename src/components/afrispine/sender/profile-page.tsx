'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  Plus,
  Loader2,
  Calendar,
  Pencil,
  X,
  Check,
} from 'lucide-react';

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
  emailVerified: boolean;
  createdAt: string;
}

interface Recipient {
  id: string;
  fullName: string;
  phone: string;
  country: string;
}

const countries = [
  { value: 'GB', label: 'United Kingdom' },
  { value: 'KE', label: 'Kenya' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'UG', label: 'Uganda' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'OTHER', label: 'Other' },
];

export function ProfilePage() {
  const sender = useAppStore((s) => s.sender);
  const loginAsSender = useAppStore((s) => s.loginAsSender);
  const sessionToken = useAppStore((s) => s.sessionToken);
  const navigate = useAppStore((s) => s.navigate);
  const [profileData, setProfileData] = useState<SenderData | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
    countryOfResidence: '',
  });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchProfile();
    fetchRecipients();
  }, [fetchProfile, fetchRecipients]);

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
        // Update the store with new data
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

  const kycBadge = kycStatus === 'approved'
    ? { label: 'Verified', color: 'bg-emerald-100 text-emerald-700' }
    : kycStatus === 'manual_review'
      ? { label: 'Under Review', color: 'bg-blue-100 text-blue-700' }
      : kycStatus === 'rejected'
        ? { label: 'Rejected', color: 'bg-red-100 text-red-700' }
        : { label: 'Not Verified', color: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-muted-foreground">Manage your account and personal details</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                {name
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'U'}
              </div>
              <div>
                <p className="font-medium">{name || 'Not set'}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{name || 'Name not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{phone || 'Phone not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{country ? countries.find((c) => c.value === country)?.label || country : 'Country not provided'}</span>
              </div>
              {profileData?.dob && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>DOB: {profileData.dob}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2"
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
              Edit details
            </Button>
          </CardContent>
        </Card>

        {/* KYC status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification status</CardTitle>
            <CardDescription>Identity verification and compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${kycStatus === 'approved' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <ShieldCheck className={`h-5 w-5 ${kycStatus === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {kycStatus === 'approved' ? 'Identity verified' : kycStatus === 'manual_review' ? 'Under review' : kycStatus === 'rejected' ? 'Verification rejected' : 'Not yet verified'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {kycCompletedAt
                    ? `Verified on ${new Date(kycCompletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : kycStatus === 'pending'
                      ? 'Verify to unlock higher limits'
                      : ''}
                </p>
              </div>
              <Badge className={kycBadge.color}>{kycBadge.label}</Badge>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              {kycIdType && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Document type</span>
                  </div>
                  <span className="font-medium capitalize">{kycIdType.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Daily limit</span>
                </div>
                <span className="font-medium">${`$${dailyLimit.toLocaleString()}`}</span>
              </div>
            </div>

            {kycStatus !== 'approved' && (
              <Button
                size="sm"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => navigate('verify')}
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {kycStatus === 'rejected' ? 'Re-submit Verification' : 'Verify Now'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved recipients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Saved recipients</CardTitle>
            <CardDescription>People you send money to frequently</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No saved recipients yet. Start a transfer to add one.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recipients.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                    {r.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.fullName}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {r.country}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
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
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last">Last Name</Label>
                <Input
                  id="edit-last"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
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
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+44 7700 000000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Country of Residence</Label>
              <Select
                value={editForm.countryOfResidence}
                onValueChange={(v) => setEditForm({ ...editForm, countryOfResidence: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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