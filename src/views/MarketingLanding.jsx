import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  LayoutDashboard,
  Calendar,
  Activity,
  Sparkles,
  Shield,
  Cloud,
  ChevronDown,
  UtensilsCrossed,
  HeartPulse,
  Sprout,
} from 'lucide-react';
import { getAuthRedirectUrl } from '../lib/authRedirect';

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function MarketingLanding({ supabase, supabaseConfigured }) {
  const canAuth = !!supabase && supabaseConfigured;
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signInGoogle = (promptSelect) => {
    if (!canAuth) return;
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
        ...(promptSelect ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    });
  };

  const faqs = [
    {
      q: 'Is Nouris medical advice?',
      a: 'No. Nouris provides educational nutrition insights from photos and your logs. It does not diagnose or treat conditions. Always talk to a qualified clinician for medical decisions.',
    },
    {
      q: 'What happens to my meal photos?',
      a: 'When you use cloud sync, images are stored securely (e.g. Supabase Storage) and tied to your account so your journal works across devices. You can delete entries from the app when supported.',
    },
    {
      q: 'Do I need my own API key?',
      a: 'Core meal analysis is handled by our backend. Some optional features (like weekly AI reports) may use a key you provide in onboarding or via environment configuration—check your setup screen after sign-in.',
    },
    {
      q: 'How is my account secured?',
      a: 'We use industry-standard sign-in with Google through Supabase Auth. Your session is stored in the browser; sign out anytime from the app.',
    },
  ];

  const features = [
    {
      icon: Sprout,
      title: 'Health garden',
      desc: 'Watch a visual garden grow as you log meals — each organ reflects patterns from your nutrition (motivational, not medical).',
    },
    {
      icon: Camera,
      title: 'Photo meal analysis',
      desc: 'Snap a plate and get calories, macros, and concise health-relevant takeaways.',
    },
    {
      icon: UtensilsCrossed,
      title: 'Meal journal',
      desc: 'Every analyzed meal is saved to your history with timestamps, meal type, and location notes.',
    },
    {
      icon: LayoutDashboard,
      title: 'Today at a glance',
      desc: 'See how your day stacks up against your calorie and macro targets.',
    },
    {
      icon: Calendar,
      title: 'Weekly insights',
      desc: 'Spot patterns across the week and get a structured health-oriented summary.',
    },
    {
      icon: Activity,
      title: 'Symptom & energy log',
      desc: 'Track how you feel and explore correlations with what you ate.',
    },
    {
      icon: HeartPulse,
      title: 'Goals that match you',
      desc: 'Onboarding captures your goal, conditions, and activity so guidance stays relevant.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Sticky header */}
      <header
        className={`sticky top-0 z-50 transition-shadow ${
          scrolled ? 'border-b border-neutral-200 bg-white/95 shadow-sm backdrop-blur-md' : 'border-b border-transparent bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900"
          >
            Nouris
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <button type="button" className="hover:text-neutral-900" onClick={() => scrollToId('how')}>
              How it works
            </button>
            <button type="button" className="hover:text-neutral-900" onClick={() => scrollToId('features')}>
              Features
            </button>
            <button type="button" className="hover:text-neutral-900" onClick={() => scrollToId('faq')}>
              FAQ
            </button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => signInGoogle(true)}
              disabled={!canAuth}
              className="hidden rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 sm:inline-flex disabled:cursor-not-allowed disabled:opacity-50"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => signInGoogle(false)}
              disabled={!canAuth}
              className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {!canAuth && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
          Sign-in will be available after you set <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> in your deployment environment.
        </div>
      )}

      {/* Hero */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
              <Sparkles size={14} className="text-neutral-900" />
              AI nutrition from a single photo
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.25rem]">
              Understand every meal in seconds.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
              Nouris turns a picture of your food into clear macros, calories, and scannable health insights—then keeps
              everything in a personal journal that syncs when you sign in with Google.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => signInGoogle(false)}
                disabled={!canAuth}
                className="btn-primary inline-flex h-12 items-center justify-center px-8 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sign up with Google
              </button>
              <button
                type="button"
                onClick={() => signInGoogle(true)}
                disabled={!canAuth}
                className="btn-secondary inline-flex h-12 items-center justify-center px-8 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Log in with Google
              </button>
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Free to start · Sync across devices · Your journal, your account
            </p>
          </motion.div>

          {/* App mockup */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-100 p-3 shadow-xl">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-inner">
                <div className="flex border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
                  <div className="text-sm font-semibold text-neutral-900">Today</div>
                  <div className="ml-auto text-xs text-neutral-500">March 20</div>
                </div>
                <div className="space-y-4 p-4">
                  <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-14 text-center">
                    <Camera className="mx-auto mb-2 text-neutral-400" size={32} strokeWidth={1.25} />
                    <p className="text-sm font-medium text-neutral-600">Add a meal photo</p>
                    <p className="text-xs text-neutral-500">Drop or tap to upload</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {['Calories', 'Protein', 'Fiber'].map((label) => (
                      <div key={label} className="rounded-xl border border-neutral-100 bg-neutral-50 py-3">
                        <div className="text-lg font-semibold text-neutral-900">—</div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-b border-neutral-200 bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">How it works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
            Three steps from plate to clarity—no manual logging marathon.
          </p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Snap your meal',
                body: 'Use your phone or desktop to upload a clear photo of what you’re eating.',
              },
              {
                step: '2',
                title: 'Get instant analysis',
                body: 'See calories, macros, and short bullet-style health notes you can actually scan.',
              },
              {
                step: '3',
                title: 'Build your journal',
                body: 'Meals, weekly views, and optional symptom logs help you connect patterns over time.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-neutral-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-b border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Everything in one place
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
            Built for people who want clarity—not another rigid diet app.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 transition-colors hover:border-neutral-300 hover:bg-white"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-neutral-200 bg-neutral-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Shield className="mx-auto mb-6 opacity-80" size={36} strokeWidth={1.25} />
          <blockquote className="text-xl font-medium leading-relaxed sm:text-2xl">
            “We built Nouris for anyone who’s tired of guessing what’s on their plate—and wants honest, structured
            feedback without the lecture.”
          </blockquote>
          <p className="mt-6 text-sm text-neutral-400">Designed for real meals, real life, real data.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-neutral-200 bg-neutral-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((item, i) => (
              <div key={item.q} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-neutral-900 sm:text-base"
                >
                  {item.q}
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-neutral-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-neutral-100 px-5 pb-4 pt-0 text-sm leading-relaxed text-neutral-600">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center shadow-sm sm:px-12">
          <Cloud className="mx-auto mb-4 text-neutral-900" size={32} strokeWidth={1.25} />
          <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">Ready to decode your next meal?</h2>
          <p className="mt-3 text-neutral-600">
            Create a free account with Google and start your synced meal journal in minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => signInGoogle(false)}
              disabled={!canAuth}
              className="btn-primary inline-flex h-12 items-center justify-center px-8 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign up with Google
            </button>
            <button
              type="button"
              onClick={() => signInGoogle(true)}
              disabled={!canAuth}
              className="btn-secondary inline-flex h-12 items-center justify-center px-8 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Log in with Google
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">Nouris</div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600">
            <a href="#privacy" className="hover:text-neutral-900" onClick={(e) => e.preventDefault()}>
              Privacy
            </a>
            <a href="#terms" className="hover:text-neutral-900" onClick={(e) => e.preventDefault()}>
              Terms
            </a>
            <button
              type="button"
              className="hover:text-neutral-900"
              onClick={() => signInGoogle(true)}
              disabled={!canAuth}
            >
              Log in
            </button>
          </div>
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Nouris. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
