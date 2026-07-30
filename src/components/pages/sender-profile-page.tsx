'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  Globe,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/app';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
};

function kycStatusConfig(status: string) {
  switch (status) {
    case 'verified':
      return {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        label: 'Verified',
        description: 'Your identity has been verified. You can send money without limits.',
        action: null,
      };
    case 'rejected':
      return {
        badge: 'bg-red-100 text-red-700 border-red-200',
        icon: ShieldAlert,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        label: 'Rejected',
        description: 'Your verification was rejected. Please contact support.',
        action: null,
      };
    default:
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Shield,
        iconColor: 'text-amber-600',
        iconBg: 'bg-amber-100',
        label: 'Pending',
        description: 'Complete identity verification to unlock full access.',
        action: 'onboarding' as const,
      };
  }
}

export default function SenderProfilePage() {
  const { user, navigate, goBack, addToast } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCountry, setEditCountry] = useState(user?.country || 'United Kingdom');

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      addToast('First and last name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('afrispine_token');
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          phone: editPhone.trim(),
          country: editCountry,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = data.user || data;
        // Update local state
        const mergedUser = {
          ...user!,
          firstName: updatedUser.firstName || editFirstName.trim(),
          lastName: updatedUser.lastName || editLastName.trim(),
          phone: updatedUser.phone || editPhone.trim(),
          country: updatedUser.country || editCountry,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('afrispine_user', JSON.stringify(mergedUser));
        }
        // Update the store user manually
        useAppStore.setState({ user: mergedUser });
        setEditing(false);
        addToast('Profile updated successfully', 'success');
      } else {
        addToast('Failed to update profile', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditPhone(user?.phone || '');
    setEditCountry(user?.country || 'United Kingdom');
    setEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
    addToast('Password changed successfully', 'success');
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(false);
    addToast('Feature coming soon', 'info');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const kyc = kycStatusConfig(user.kycStatus);
  const KycIcon = kyc.icon;
  const initials = `${(user.firstName || 'U')[0]}${(user.lastName || '')[0]}`.toUpperCase();
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={goBack}
            className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        </motion.div>

        {/* Profile Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-24 sm:h-28" />
            <CardContent className="p-5 sm:p-6 -mt-12 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="h-20 w-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {initials}
                  </span>
                </div>
                <div className="flex-1 sm:pb-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member since {memberSince}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KYC Status */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`h-11 w-11 rounded-xl ${kyc.iconBg} flex items-center justify-center shrink-0`}>
                  <KycIcon className={`h-5 w-5 ${kyc.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      KYC Verification
                    </h3>
                    <Badge className={`${kyc.badge} text-xs`}>{kyc.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {kyc.description}
                  </p>
                  {kyc.action && (
                    <Button
                      onClick={() => navigate('onboarding')}
                      size="sm"
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700 h-9"
                    >
                      <Shield className="h-4 w-4 mr-1.5" />
                      Complete Verification
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Information */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Personal Information
                </h3>
                {!editing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="text-emerald-600 hover:text-emerald-700 h-8 px-2"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-8 px-2 text-gray-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">First Name</Label>
                  {editing ? (
                    <Input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.firstName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Last Name</Label>
                  {editing ? (
                    <Input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.lastName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Read only
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {editing ? (
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +44 7700 900123"
                      className="h-10"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {user.phone || 'Not set'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  {editing ? (
                    <Select value={editCountry} onValueChange={setEditCountry}>
                      <SelectTrigger className="h-10 w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                        <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                        <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {user.country || 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500" />
                Security
              </h3>

              {!showPasswordForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                  className="h-11 border-gray-200 w-full sm:w-auto"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="curpw" className="text-xs text-muted-foreground">
                      Current Password
                    </Label>
                    <Input
                      id="curpw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newpw" className="text-xs text-muted-foreground">
                      New Password
                    </Label>
                    <Input
                      id="newpw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmpw" className="text-xs text-muted-foreground">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmpw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-10"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 h-10 border-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {changingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      )}
                      {changingPassword ? 'Changing...' : 'Update Password'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border border-red-100 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? All your data including
              transfer history and recipient information will be permanently removed.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 h-11 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}