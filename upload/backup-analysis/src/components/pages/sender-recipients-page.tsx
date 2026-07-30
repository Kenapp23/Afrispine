'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit3,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Smartphone,
  Star,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, Recipient } from '@/stores/app';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function SenderRecipientsPage() {
  const { recipients, setRecipients, goBack, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Recipient | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCountry, setFormCountry] = useState('Kenya');
  const [formMobileMoney, setFormMobileMoney] = useState('M-Pesa');

  useEffect(() => {
    async function fetchRecipients() {
      try {
        const token = localStorage.getItem('afrispine_token');
        const res = await fetch('/api/recipients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecipients(data.recipients || data || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchRecipients();
  }, [setRecipients]);

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormCountry('Kenya');
    setFormMobileMoney('M-Pesa');
    setEditingRecipient(null);
  };

  const openAddSheet = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEditSheet = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setFormName(recipient.name);
    setFormPhone(recipient.phone);
    setFormCountry(recipient.country);
    setFormMobileMoney(recipient.mobileMoney);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPhone.trim()) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('afrispine_token');
      const isEdit = !!editingRecipient;
      const url = isEdit
        ? `/api/recipients/${editingRecipient.id}`
        : '/api/recipients';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim(),
          country: formCountry,
          mobileMoney: formMobileMoney,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const saved = data.recipient || data;
        if (isEdit) {
          setRecipients(
            recipients.map((r) =>
              r.id === editingRecipient.id ? { ...r, ...saved } : r
            )
          );
          addToast('Recipient updated', 'success');
        } else {
          setRecipients([...recipients, saved]);
          addToast('Recipient added', 'success');
        }
        setSheetOpen(false);
        resetForm();
      } else {
        addToast(data.error || 'Failed to save recipient', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (recipient: Recipient) => {
    setDeleteTarget(recipient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('afrispine_token');
      const res = await fetch(`/api/recipients/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRecipients(recipients.filter((r) => r.id !== deleteTarget.id));
        addToast('Recipient deleted', 'success');
      } else {
        addToast('Failed to delete recipient', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleDefault = async (recipient: Recipient) => {
    try {
      const token = localStorage.getItem('afrispine_token');
      const res = await fetch(`/api/recipients/${recipient.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDefault: !recipient.isDefault }),
      });
      if (res.ok) {
        setRecipients(
          recipients.map((r) => ({
            ...r,
            isDefault: r.id === recipient.id ? !r.isDefault : r.isDefault && r.id !== recipient.id ? false : r.isDefault,
          }))
        );
        addToast('Default recipient updated', 'success');
      }
    } catch {
      addToast('Failed to update', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Recipients</h1>
              <p className="text-sm text-muted-foreground">
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={openAddSheet}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Add Recipient</span>
          </Button>
        </motion.div>

        {/* Recipients List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : recipients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No recipients yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a recipient to start sending money
            </p>
            <Button
              onClick={openAddSheet}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {recipients.map((r: Recipient, i: number) => (
                <motion.div
                  key={r.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 truncate">
                                {r.name}
                              </p>
                              {r.isDefault && (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px] px-1.5 py-0">
                                  <Star className="h-2.5 w-2.5 mr-0.5" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{r.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                                <Smartphone className="h-3 w-3 mr-1" />
                                {r.mobileMoney}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                🇰🇪 {r.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditSheet(r)}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(r)}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      {/* Default toggle */}
                      {!r.isDefault && (
                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Set as default recipient
                          </span>
                          <Switch
                            checked={r.isDefault || false}
                            onCheckedChange={() => handleToggleDefault(r)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) resetForm(); setSheetOpen(open); }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
            </SheetTitle>
            <SheetDescription>
              {editingRecipient
                ? 'Update the recipient details below.'
                : 'Add a new recipient to send money to.'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rname">Full Name *</Label>
              <Input
                id="rname"
                placeholder="e.g. Jane Wanjiru"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rphone">Phone Number *</Label>
              <Input
                id="rphone"
                placeholder="e.g. +254 712 345 678"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcountry">Country</Label>
              <Select value={formCountry} onValueChange={setFormCountry}>
                <SelectTrigger id="rcountry" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                  <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                  <SelectItem value="Tanzania">🇹🇿 Tanzania</SelectItem>
                  <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                  <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rmobile">Mobile Money</Label>
              <Select value={formMobileMoney} onValueChange={setFormMobileMoney}>
                <SelectTrigger id="rmobile" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                  <SelectItem value="MTN Mobile Money">MTN Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={() => { resetForm(); setSheetOpen(false); }}
              className="flex-1 h-11 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPhone.trim()}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingRecipient ? (
                <Edit3 className="h-4 w-4 mr-1.5" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              {saving ? 'Saving...' : editingRecipient ? 'Update' : 'Add Recipient'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Recipient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
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
              onClick={handleDeleteConfirm}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}