import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Button, Input, Label } from '@/components/ui';
import { ArrowRight, HeartPulse, Info, Mail, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Login() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'staff' | 'request'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverified(false);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const msg = authError.message.toLowerCase();

      // Supabase returns different messages depending on version/config for unverified emails
      const isUnconfirmed =
        msg.includes('email not confirmed') ||
        msg.includes('not confirmed') ||
        msg.includes('invalid login credentials');

      if (isUnconfirmed) {
        // Try to determine if the account exists but is unconfirmed
        // by checking if credentials are likely correct (Supabase doesn't always
        // distinguish "wrong password" from "unconfirmed" in older versions)
        setUnverified(true);
        setError('');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Extra guard: if session exists but email not confirmed (shouldn't normally happen)
    if (data.user && !data.user.email_confirmed_at && !data.session) {
      await supabase.auth.signOut();
      setUnverified(true);
      setLoading(false);
      return;
    }

    setLocation('/dashboard');
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (!error) {
      setResendSent(true);
      setTimeout(() => setResendSent(false), 8000);
    } else {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1923] px-4 py-10 text-white">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
        <div className="text-center mb-7">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] mb-3">
            <HeartPulse className="h-6 w-6 text-[#378ADD]" />
          </div>
          <h1 className="text-[22px] leading-tight font-medium text-white">CardioDash</h1>
          <p className="text-sm text-white/45 mt-1">Medical Management</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#1a2535] p-8">
          <div className="grid grid-cols-2 border-b border-white/[0.08] mb-7">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`pb-3 text-sm transition-colors border-b-2 ${
                activeTab === 'staff'
                  ? 'text-white font-medium border-[#378ADD]'
                  : 'text-white/45 border-transparent hover:text-white/70'
              }`}
            >
              Staff sign in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`pb-3 text-sm transition-colors border-b-2 ${
                activeTab === 'request'
                  ? 'text-white font-medium border-[#378ADD]'
                  : 'text-white/45 border-transparent hover:text-white/70'
              }`}
            >
              Request appointment
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'request' ? (
              <motion.div key="request" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5 text-center">
                <div className="space-y-2 py-2">
                  <p className="text-lg font-medium text-white">Want to book an appointment?</p>
                  <p className="text-sm leading-relaxed text-white/45">
                    Patients can submit a public appointment request without creating an account.
                  </p>
                </div>
                <Link href="/request">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-lg border-[#378ADD] bg-transparent text-[#378ADD] hover:bg-[#378ADD]/10 hover:text-[#62a8ef] hover:border-[#62a8ef] shadow-none"
                  >
                    Go to appointment request <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ) : unverified ? (
              <motion.div key="unverified" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-400/20">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-200">Email not verified or wrong password</p>
                      <p className="text-xs text-amber-100/70 mt-1 leading-relaxed">
                        Either your password is wrong, or your account hasn't been verified yet.
                        Check your inbox for a verification email.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#378ADD]/10 border border-[#378ADD]/20">
                  <div className="flex gap-2.5">
                    <Info className="h-4 w-4 text-[#62a8ef] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60 leading-relaxed">
                      <strong>No email received?</strong> In your Supabase dashboard, go to{' '}
                      <strong>Authentication - Providers - Email</strong> and turn off{' '}
                      <strong>"Confirm email"</strong>. Then you can log in immediately.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-11 rounded-lg border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.1] shadow-none"
                  onClick={handleResend}
                  disabled={resending || resendSent || !email}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                  {resendSent ? 'Verification email sent! Check inbox.' : resending ? 'Sending...' : 'Resend verification email'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setUnverified(false); setError(''); }}
                  className="w-full text-sm text-white/45 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleLogin} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error && (
                  <div className="p-3 bg-red-500/10 text-red-200 text-sm rounded-lg border border-red-400/20">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.14em] text-white/50 font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-lg bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/35 focus-visible:ring-0 focus-visible:border-[#378ADD]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.14em] text-white/50 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-lg bg-white/[0.06] border-white/[0.12] text-white placeholder:text-white/35 focus-visible:ring-0 focus-visible:border-[#378ADD]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-[#1f5f9f] text-white font-medium hover:bg-[#2d75bd] shadow-none"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
