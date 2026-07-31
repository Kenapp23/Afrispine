'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, TrendingUp, Briefcase, ArrowRight, Loader2, Send, Landmark, GraduationCap, Shield, ShoppingCart } from 'lucide-react';

const INDUSTRIES = ['Fintech', 'Banking', 'Real Estate', 'Insurance', 'Education', 'E-commerce', 'IPO', 'Other'];

function getNextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

const industryIcons: Record<string, React.ReactNode> = {
  Fintech: <TrendingUp className="size-5" />, Banking: <Landmark className="size-5" />,
  'Real Estate': <Briefcase className="size-5" />, Insurance: <Shield className="size-5" />,
  Education: <GraduationCap className="size-5" />, 'E-commerce': <ShoppingCart className="size-5" />,
  IPO: <TrendingUp className="size-5" />, Other: <Briefcase className="size-5" />,
};

export function DigestAdvertisePage() {
  const nav = useAppStore(s => s.navigate);
  const { t } = useTranslation();
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('verified') === 'true') return 4;
    return 1;
  });
  const [verified, setVerified] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('verified') === 'true') return true;
    return false;
  });
  const [error, setError] = useState('');
  const [form, setForm] = useState({ companyName: '', contactEmail: '', industry: '', headline: '', body: '', ctaText: '', ctaUrl: '', issueDate: getNextMonday(), package: 'single' as 'single' | 'monthly' | 'quarterly' });

  const wordCount = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0;
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const canContinue = form.companyName && form.contactEmail.includes('@') && form.industry && wordCount(form.headline) <= 10 && wordCount(form.body) <= 80 && form.ctaText && form.ctaUrl.startsWith('https://');

  const handleBook = async () => {
    setStep(3); setError('');
    try {
      const res = await fetch('/api/digest/ads/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: form.companyName, contactEmail: form.contactEmail, industry: form.industry, headline: form.headline, body: form.body, ctaText: form.ctaText, ctaUrl: form.ctaUrl, targetDate: form.issueDate, package: form.package }),
      });
      const data = await res.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
      else setError(data.error || 'Payment initialization failed.');
    } catch { setError('Network error. Please try again.'); }
  };

  // Success state
  if (step === 4 && verified) return (
    <div className="min-h-screen" style={{ background: '#FAF8F3' }}>
      <div className="max-w-[900px] mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-full mb-6" style={{ background: '#E8F5EE' }}><Send className="size-7" style={{ color: '#0A4D2E' }} /></div>
        <h1 className="font-serif text-3xl font-bold mb-3" style={{ color: '#1A1008' }}>Payment received!</h1>
        <p className="text-lg mb-2" style={{ color: '#1A1008' }}>Your ad is under review.</p>
        <p className="text-sm mb-10" style={{ color: '#6B5E4B' }}>We&apos;ll approve within 24 hours. You&apos;ll receive an email confirmation.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => nav('digest-current')} className="text-sm">Read Latest Issue →</Button>
          <Button onClick={() => nav('landing')} style={{ background: '#0A4D2E' }} className="text-white text-sm">Back to AfriSpine</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F3' }}>
      <div className="max-w-[900px] mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-3 font-semibold" style={{ color: '#C9981A' }}>ADVERTISE IN THE DIGEST</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4" style={{ color: '#1A1008' }}>Reach 50,000+ African Diaspora Investors</h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: '#6B5E4B' }}>The only media channel built for this audience. Hyper-targeted, financially active, impossible to reach anywhere else.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ n: '50,000+', l: 'Subscribers' }, { n: '40%', l: 'Open Rate' }, { n: '52', l: 'Countries' }, { n: '$800', l: 'Starting Price' }].map(s => (
              <div key={s.l} className="p-4 rounded-xl text-center" style={{ background: 'white', border: '1px solid #E5E0D8' }}>
                <p className="text-2xl font-bold" style={{ color: '#0A4D2E' }}>{s.n}</p>
                <p className="text-xs mt-1" style={{ color: '#6B5E4B' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Audience */}
        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-6 font-semibold" style={{ color: '#C9981A' }}>WHO READS THE DIGEST?</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Send className="size-5" />, title: 'The Remitter', desc: 'Sends money home weekly. Ages 25–45. UK, US & Canada.' },
              { icon: <TrendingUp className="size-5" />, title: 'The Investor', desc: 'Buys African stocks, bonds, real estate. Ages 30–55.' },
              { icon: <Briefcase className="size-5" />, title: 'The Executive', desc: 'C-suite diaspora considering African opportunities. Ages 35–60.' },
            ].map(p => (
              <div key={p.title} className="p-5 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D8' }}>
                <div className="mb-3 p-2.5 rounded-lg inline-block" style={{ background: '#E8F5EE', color: '#0A4D2E' }}>{p.icon}</div>
                <h3 className="font-serif font-bold text-base mb-1.5" style={{ color: '#1A1008' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B5E4B' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-6 font-semibold" style={{ color: '#C9981A' }}>PRICING</p>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {[
              { name: 'Single Issue', price: '$800/issue', desc: 'One ad in one weekly issue', pkg: 'single' as const },
              { name: 'Monthly Package', price: '$2,800/mo', desc: '4 issues, save $400', pkg: 'monthly' as const, featured: true },
              { name: 'Quarterly Package', price: '$8,500/qtr', desc: '13 issues, save $2,100', pkg: 'quarterly' as const },
            ].map(p => (
              <div key={p.name} onClick={() => update('package', p.pkg)} className="p-5 rounded-xl text-center cursor-pointer transition-shadow hover:shadow-md" style={{ background: 'white', border: `2px solid ${p.featured ? '#0A4D2E' : '#E5E0D8'}` }}>
                {p.featured && <Badge className="mb-3 text-white" style={{ background: '#0A4D2E' }}>Most Popular</Badge>}
                <h3 className="font-bold text-sm mb-1" style={{ color: '#1A1008' }}>{p.name}</h3>
                <p className="text-2xl font-bold mb-1" style={{ color: '#0A4D2E' }}>{p.price}</p>
                <p className="text-xs" style={{ color: '#6B5E4B' }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl text-center text-sm" style={{ background: '#FFFBEB', border: '1px solid #C9981A', color: '#1A1008' }}>
            <span className="font-bold" style={{ color: '#C9981A' }}>Dangote IPO Feature Placement:</span> $2,500 flat — Dedicated issue feature with premium placement
          </div>
        </section>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: step >= s ? '#0A4D2E' : '#E5E0D8', color: step >= s ? 'white' : '#6B5E4B' }}>{s}</div>
              {s < 3 && <div className="w-8 h-0.5" style={{ background: step > s ? '#0A4D2E' : '#E5E0D8' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Ad Details */}
        {step === 1 && (
          <section className="p-6 md:p-8 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D8' }}>
            <h2 className="font-serif text-xl font-bold mb-6" style={{ color: '#1A1008' }}>Ad Details</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div><Label className="mb-1.5">Company name *</Label><Input required value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Acme Investments" style={{ borderColor: '#E5E0D8' }} /></div>
              <div><Label className="mb-1.5">Contact email *</Label><Input required type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder="ads@company.com" style={{ borderColor: '#E5E0D8' }} /></div>
            </div>
            <div className="mb-4">
              <Label className="mb-1.5">Industry *</Label>
              <Select value={form.industry} onValueChange={v => update('industry', v)}>
                <SelectTrigger className="w-full" style={{ borderColor: '#E5E0D8' }}><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <Label className="mb-1.5">Ad headline * <span className="font-normal text-xs" style={{ color: '#6B5E4B' }}>({wordCount(form.headline)}/10 words)</span></Label>
              <Input required value={form.headline} onChange={e => update('headline', e.target.value)} placeholder="Explore African markets" style={{ borderColor: '#E5E0D8' }} />
              {wordCount(form.headline) > 10 && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>Max 10 words</p>}
            </div>
            <div className="mb-4">
              <Label className="mb-1.5">Ad body * <span className="font-normal text-xs" style={{ color: '#6B5E4B' }}>({wordCount(form.body)}/80 words)</span></Label>
              <textarea required rows={3} value={form.body} onChange={e => update('body', e.target.value)} placeholder="Describe your offer in up to 80 words..." className="w-full rounded-md border px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-offset-1" style={{ borderColor: '#E5E0D8', focusRingColor: '#0A4D2E' }} />
              {wordCount(form.body) > 80 && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>Max 80 words</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div><Label className="mb-1.5">CTA button text *</Label><Input required value={form.ctaText} onChange={e => update('ctaText', e.target.value)} placeholder="Get Started" style={{ borderColor: '#E5E0D8' }} /></div>
              <div><Label className="mb-1.5">CTA URL *</Label><Input required value={form.ctaUrl} onChange={e => update('ctaUrl', e.target.value)} placeholder="https://..." style={{ borderColor: '#E5E0D8' }} />{form.ctaUrl && !form.ctaUrl.startsWith('https://') && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>Must start with https://</p>}</div>
            </div>
            <div className="mb-4">
              <Label className="mb-1.5">Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: '#E5E0D8' }}>
                <p className="text-sm" style={{ color: '#6B5E4B' }}>Logo upload coming soon</p>
              </div>
            </div>
            <div className="mb-4">
              <Label className="mb-1.5">Target issue date</Label>
              <Input type="date" value={form.issueDate} onChange={e => update('issueDate', e.target.value)} min={getNextMonday()} style={{ borderColor: '#E5E0D8' }} />
            </div>
            <div className="mb-6">
              <Label className="mb-3 block">Package *</Label>
              <RadioGroup value={form.package} onValueChange={v => update('package', v)} className="grid grid-cols-3 gap-3">
                {[{ v: 'single', l: 'Single', p: '$800' }, { v: 'monthly', l: 'Monthly', p: '$2,800' }, { v: 'quarterly', l: 'Quarterly', p: '$8,500' }].map(o => (
                  <label key={o.v} className="flex items-center gap-2 p-3 rounded-lg cursor-pointer text-sm" style={{ border: `1.5px solid ${form.package === o.v ? '#0A4D2E' : '#E5E0D8'}`, background: form.package === o.v ? '#F0FDF4' : 'white' }}>
                    <RadioGroupItem value={o.v} />
                    <div><span className="font-medium" style={{ color: '#1A1008' }}>{o.l}</span><br /><span style={{ color: '#0A4D2E' }} className="font-bold">{o.p}</span></div>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <Button onClick={() => { if (!canContinue) { toast.error('Please fill all required fields correctly.'); return; } setStep(2); }} className="w-full text-white font-medium" style={{ background: '#0A4D2E' }}>Continue to Payment <ArrowRight className="ml-2 size-4" /></Button>
          </section>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <section className="p-6 md:p-8 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D8' }}>
            <h2 className="font-serif text-xl font-bold mb-6" style={{ color: '#1A1008' }}>Ad Preview</h2>
            <div className="p-6 rounded-xl mb-4" style={{ background: '#FAF8F3', border: '1px solid #E5E0D8' }}>
              <div className="flex items-center gap-2 mb-3"><div className="p-1.5 rounded" style={{ background: '#E8F5EE' }}>{industryIcons[form.industry] || <Briefcase className="size-4" style={{ color: '#0A4D2E' }} />}</div><p className="font-bold text-sm" style={{ color: '#1A1008' }}>{form.companyName}</p></div>
              <p className="text-[10px] tracking-widest uppercase font-semibold mb-2" style={{ color: '#C9981A' }}>Sponsored</p>
              <h3 className="font-serif text-lg font-bold mb-2" style={{ color: '#1A1008' }}>{form.headline}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B5E4B' }}>{form.body}</p>
              <button className="px-5 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#0A4D2E' }}>{form.ctaText}</button>
            </div>
            <p className="text-center text-xs mb-6" style={{ color: '#6B5E4B' }}>This is exactly what 50,000+ readers will see.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Edit</Button>
              <Button onClick={handleBook} className="flex-1 text-white font-medium" style={{ background: '#0A4D2E' }}>Confirm and Pay <ArrowRight className="ml-2 size-4" /></Button>
            </div>
          </section>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <section className="p-12 rounded-xl text-center" style={{ background: 'white', border: '1px solid #E5E0D8' }}>
            {error ? (
              <><p className="text-lg font-bold mb-2" style={{ color: '#DC2626' }}>Payment Error</p><p className="text-sm mb-6" style={{ color: '#6B5E4B' }}>{error}</p><Button onClick={handleBook} className="text-white" style={{ background: '#0A4D2E' }}>Try Again</Button></>
            ) : (
              <><Loader2 className="size-8 animate-spin mx-auto mb-4" style={{ color: '#0A4D2E' }} /><p className="text-lg font-medium" style={{ color: '#1A1008' }}>Redirecting to payment...</p></>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 text-xs" style={{ borderTop: '1px solid #E5E0D8' }}>
          <div className="flex justify-center gap-6" style={{ color: '#6B5E4B' }}>
            <button onClick={() => nav('digest-current')} className="hover:underline">Read Latest Issue →</button>
            <button onClick={() => nav('landing')} className="hover:underline">Back to AfriSpine →</button>
          </div>
        </footer>
      </div>
    </div>
  );
}