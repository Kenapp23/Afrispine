'use client';
import { useState } from 'react';
import { useApp, nav } from '@/stores/app';
import { ArrowLeft } from 'lucide-react';

export function AuthPages() {
  const { route } = useApp();
  if (route === 'signup') return <Signup />;
  if (route === 'forgot-password') return <ForgotPassword />;
  if (route === 'onboarding') return <Onboarding />;
  return <Login />;
}

function Login() {
  const { setSender } = useApp();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true);
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
    const d = await r.json(); setLoading(false);
    if (!r.ok) { setErr(d.error); return; }
    setSender(d); nav('dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4">A</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Log in to your AfriSpine account</p>
        </div>
        {err && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={pw} onChange={e => setPw(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">{loading ? 'Logging in...' : 'Log in'}</button>
        </form>
        <div className="mt-4 text-center text-sm"><button onClick={() => nav('forgot-password')} className="text-emerald-600 hover:underline">Forgot password?</button></div>
        <p className="mt-3 text-center text-sm text-gray-500">New here? <button onClick={() => nav('signup')} className="text-emerald-600 font-medium hover:underline">Create account</button></p>
      </div>
    </div>
  );
}

function Signup() {
  const { setSender } = useApp();
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  function set(k: string, v: string) { setF(p => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true);
    const r = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json(); setLoading(false);
    if (!r.ok) { setErr(d.error); return; }
    setSender(d); nav('onboarding');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6"><div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4">A</div><h1 className="text-2xl font-bold">Create your account</h1></div>
        {err && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">First name</label><input required value={f.firstName} onChange={e => set('firstName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Last name</label><input required value={f.lastName} onChange={e => set('lastName', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={f.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required minLength={6} value={f.password} onChange={e => set('password', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">Already have an account? <button onClick={() => nav('login')} className="text-emerald-600 font-medium hover:underline">Log in</button></p>
      </div>
    </div>
  );
}

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        {sent ? <><p className="text-gray-500 mb-4">Check your email for a reset link.</p><button onClick={() => nav('login')} className="text-emerald-600 font-medium hover:underline">Back to login</button></>
        : <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4 text-left"><p className="text-gray-500">Enter your email.</p><input type="email" required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /><button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Send reset link</button></form>}
      </div>
    </div>
  );
}

function Onboarding() {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({ firstName: '', lastName: '', phone: '', dob: '', country: 'GB' });
  const [kycId, setKycId] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const { sender, setSender } = useApp();

  function set(k: string, v: string) { setDetails(p => ({ ...p, [k]: v })); }

  async function submitKyc() {
    setKycStatus('pending');
    const r = await fetch('/api/auth/me').then(r2 => r2.json());
    // Mock KYC approval
    setTimeout(() => { setKycStatus('approved'); }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="font-bold text-gray-900">AfriSpine</span>
        </div>
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">First name</label><input value={details.firstName} onChange={e => set('firstName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last name</label><input value={details.lastName} onChange={e => set('lastName', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={details.phone} onChange={e => set('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+44 7700 900000" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label><input value={details.dob} onChange={e => set('dob', e.target.value)} placeholder="YYYY-MM-DD" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><select value={details.country} onChange={e => set('country', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"><option>GB</option><option>US</option><option>CA</option><option>AU</option></select></div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Verify identity</h2>
            <p className="text-sm text-gray-500">We use Smile ID for fast verification. In production, a document + liveness widget would appear here.</p>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              {kycStatus === '' && <><p className="text-sm text-gray-600 mb-4">Tap below to start verification</p><button onClick={submitKyc} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">Start verification</button></>}
              {kycStatus === 'pending' && <div className="flex items-center justify-center gap-2"><div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" /><span className="text-gray-600">Verifying...</span></div>}
              {kycStatus === 'approved' && <><p className="text-emerald-600 font-medium text-lg">Identity verified!</p><p className="text-sm text-gray-500 mt-1">You're all set to transfer money.</p></>}
            </div>
            <button onClick={() => setStep(3)} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Continue</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold">You're all set!</h2>
            <p className="text-gray-500">Your AfriSpine account is ready. You can add your first recipient later from your profile.</p>
            <button onClick={() => { if (sender) setSender({ ...sender, kycStatus: 'verified' }); nav('dashboard'); }} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition text-lg">Go to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}