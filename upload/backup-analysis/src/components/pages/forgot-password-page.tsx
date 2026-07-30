'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotFormValues) {
    setLoading(true);
    // Simulated — no real email is sent
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast.success(`Password reset link sent to ${values.email}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <button
            onClick={() => navigate('landing')}
            className="mx-auto flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg">
              A
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Afri<span className="text-emerald-600">Spine</span>
            </span>
          </button>
        </div>

        <Card className="border-0 shadow-lg shadow-gray-200/60">
          <CardHeader className="pb-2" />
          <CardContent>
            {!submitted ? (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    Reset Password
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your email and we&apos;ll send you a link to reset
                    your password.
                  </p>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
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
                      disabled={loading}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-base"
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Send Reset Link
                    </Button>
                  </form>
                </Form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <svg
                    className="h-8 w-8 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Check Your Email
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  If an account exists with that email, you&apos;ll receive a
                  password reset link shortly.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}