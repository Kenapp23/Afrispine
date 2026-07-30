'use client';
import { useState } from 'react';
import { useApp, nav } from '@/stores/app';
import { ArrowLeft, Save, LogOut, Shield, User } from 'lucide-react';

export function ProfilePage() {
  const { sender, setSender, setRoute, logout } = useApp();
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => setRoute('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <span className="font-semibold">Profile</span>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-8 h-8 text-emerald-600" /></div>
          <h2 className="text-xl font-bold">{sender?.firstName} {sender?.lastName}</h2>
          <p className="text-gray-500">{sender?.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className={`w-4 h-4 ${sender?.kycStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className={`text-sm font-medium ${sender?.kycStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>KYC: {sender?.kycStatus}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold">Account</h3>
          {[['Email', sender?.email], ['Phone', sender?.phone], ['Country', sender?.countryOfResidence], ['Daily limit', `$${sender?.dailyLimitUsd}`], ['Status', sender?.accountStatus]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between py-2 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{l}</span><span className="text-sm font-medium">{v as string}</span></div>
          ))}
        </div>
        <button onClick={logout} className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Log out</button>
      </main>
    </div>
  );
}