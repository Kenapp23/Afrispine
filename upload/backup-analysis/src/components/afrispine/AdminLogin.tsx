'use client';
import { useState } from 'react';
import { useApp, nav } from '@/stores/app';

export function AdminLogin() {
  const { setAdmin } = useApp();
  const [email, setEmail] = useState('admin@afrispine.com');
  const [pw, setPw] = useState('admin123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true);
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
    const d = await r.json(); setLoading(false);
    if (!r.ok) { setErr(d.error); return; }
    setAdmin(d); nav('admin-dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-3">A</div>
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <p className="text-gray-400 text-sm">AfriSpine superadmin</p>
        </div>
        {err && <div className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">{loading ? '...' : 'Log in'}</button>
        </form>
        <button onClick={() => nav('landing')} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-300">← Back to site</button>
      </div>
    </div>
  );
}