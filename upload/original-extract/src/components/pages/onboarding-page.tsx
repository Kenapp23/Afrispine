'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Camera,
  PartyPopper,
  CheckCircle2,
  UserCircle,
  ShieldCheck,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/* ─── Schemas ─────────────────────────────────────────────── */

const profileSchema = z.object({
  phone: z.string().min(6, 'Please enter a valid phone number'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const kycSchema = z.object({
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  idType: z.string().min(1, 'Please select an ID type'),
  idNumber: z.string().min(1, 'ID number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().optional(),
});

type KycFormValues = z.infer<typeof kycSchema>;

/* ─── Confetti particles ──────────────────────────────────── */

const confettiColors = [
  'bg-emerald-400',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-amber-500',
  'bg-yellow-300',
  'bg-green-300',
];

function ConfettiPiece({ delay, color, left }: { delay: number; color: string; left: string }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: -20, x: 0, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, 120, 200],
        x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 120],
        rotate: [0, 180 + Math.random() * 360],
      }}
      transition={{ duration: 2, delay, ease: 'easeOut' }}
      className={`absolute top-10 ${color} rounded-sm`}
      style={{ left, width: 8 + Math.random() * 6, height: 8 + Math.random() * 6 }}
    />
  );
}

/* ─── Step indicator ──────────────────────────────────────── */

const steps = [
  { label: 'Profile', icon: UserCircle },
  { label: 'Verify Identity', icon: ShieldCheck },
  { label: 'Done', icon: CheckCircle2 },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((step, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={step.label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                  done
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  active ? 'text-emerald-600' : done ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-16 rounded-full transition-colors duration-300 ${
                  done ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */

export default function OnboardingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const token = useAppStore((s) => s.token);
  const setUser = useAppStore((s) => s.setUser);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: '' },
  });

  const kycForm = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      dateOfBirth: '',
      idType: '',
      idNumber: '',
      address: '',
      city: '',
      postalCode: '',
    },
  });

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSkip() {
    navigate('sender-dashboard');
  }

  async function onProfileSubmit() {
    goNext();
  }

  async function onKycSubmit(values: KycFormValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'KYC submission failed.');
        return;
      }

      if (data.user) {
        setUser(data.user, token || '');
      }

      toast.success('Identity verified successfully!');
      goNext();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="mb-6 text-center">
          <button
            onClick={() => navigate('landing')}
            className="mx-auto flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
              A
            </div>
            <span className="text-xl font-bold text-gray-900">
              Afri<span className="text-emerald-600">Spine</span>
            </span>
          </button>
        </div>

        <StepIndicator current={step} />

        <Card className="border-0 shadow-lg shadow-gray-200/60 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ─── Step 0: Profile ─────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <CardHeader className="pb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    Complete Your Profile
                  </h1>
                  <p className="text-sm text-gray-500">
                    Add a phone number and profile photo so recipients can
                    recognise you.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile picture upload (simulated) */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 hover:bg-emerald-50 transition-colors"
                      onClick={() =>
                        toast.info('Photo upload coming soon!')
                      }
                    >
                      <UserCircle className="h-12 w-12 text-gray-300 group-hover:text-emerald-400 transition-colors" />
                      <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                        <Camera className="h-4 w-4" />
                      </div>
                    </button>
                  </div>

                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-5"
                    >
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+44 7700 000000"
                                autoComplete="tel"
                                className="h-11 rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-base"
                      >
                        Continue
                      </Button>
                    </form>
                  </Form>

                  <button
                    onClick={handleSkip}
                    className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip for now
                  </button>
                </CardContent>
              </motion.div>
            )}

            {/* ─── Step 1: KYC ────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <CardHeader className="pb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    Verify Your Identity
                  </h1>
                  <p className="text-sm text-gray-500">
                    We need a few details to comply with regulations and keep
                    your money safe.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Form {...kycForm}>
                    <form
                      onSubmit={kycForm.handleSubmit(onKycSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={kycForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Date of Birth
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-11 rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={kycForm.control}
                        name="idType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              ID Type
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-lg">
                                  <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="passport">
                                  Passport
                                </SelectItem>
                                <SelectItem value="national_id">
                                  National ID
                                </SelectItem>
                                <SelectItem value="drivers_license">
                                  Driver&apos;s License
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={kycForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              ID Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your ID number"
                                className="h-11 rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={kycForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123 Main Street"
                                autoComplete="street-address"
                                className="h-11 rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={kycForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">
                                City
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="City"
                                  autoComplete="address-level2"
                                  className="h-11 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={kycForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Postal Code
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="SW1A 1AA"
                                  autoComplete="postal-code"
                                  className="h-11 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goBack}
                          className="h-11 rounded-lg border-gray-300"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-base"
                        >
                          {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Submit Verification
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <button
                    onClick={handleSkip}
                    className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip for now
                  </button>
                </CardContent>
              </motion.div>
            )}

            {/* ─── Step 2: Success ────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <CardContent className="relative py-12 overflow-hidden">
                  {/* Confetti */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <ConfettiPiece
                      key={i}
                      delay={i * 0.06}
                      color={confettiColors[i % confettiColors.length]}
                      left={`${10 + Math.random() * 80}%`}
                    />
                  ))}

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2,
                      }}
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
                    >
                      <PartyPopper className="h-10 w-10 text-emerald-600" />
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-bold text-gray-900"
                    >
                      You&apos;re All Set!
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="mt-2 max-w-sm text-sm text-gray-500"
                    >
                      Your account is ready. You can now start sending money to
                      your loved ones in Kenya instantly.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="mt-8 w-full"
                    >
                      <Button
                        onClick={() => navigate('sender-dashboard')}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-base shadow-lg shadow-emerald-600/20"
                      >
                        Go to Dashboard
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}