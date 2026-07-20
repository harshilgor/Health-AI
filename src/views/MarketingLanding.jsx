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
  ArrowRight,
  Zap,
} from 'lucide-react';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import MealLogDemo from '../components/landing/MealLogDemo';

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

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
      desc: 'Watch a visual garden grow as you log meals — each organ reflects patterns from your nutrition.',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      icon: Camera,
      title: 'Photo meal analysis',
      desc: 'Snap a plate and get calories, macros, and concise health-relevant takeaways.',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      icon: UtensilsCrossed,
      title: 'Meal journal',
      desc: 'Every analyzed meal is saved to your history with timestamps, meal type, and location notes.',
      color: 'bg-sky-50 text-sky-700',
    },
    {
      icon: LayoutDashboard,
      title: 'Today at a glance',
      desc: 'See how your day stacks up against your calorie and macro targets.',
      color: 'bg-violet-50 text-violet-700',
    },
    {
      icon: Calendar,
      title: 'Weekly insights',
      desc: 'Spot patterns across the week and get a structured health-oriented summary.',
      color: 'bg-rose-50 text-rose-700',
    },
    {
      icon: Activity,
      title: 'Symptom & energy log',
      desc: 'Track how you feel and explore correlations with what you ate.',
      color: 'bg-orange-50 text-orange-700',
    },
  ];

  const foodGallery = [
    { src: '/images/landing/hero-meal-bowl.png', label: 'Salmon grain bowl' },
    { src: '/images/landing/demo-salad.png', label: 'Chicken salad' },
    { src: '/images/landing/demo-breakfast.png', label: 'Avocado toast' },
  ];

  const stats = [
    { value: '< 5s', label: 'Analysis time' },
    { value: '15+', label: 'Nutrients tracked' },
    { value: '100%', label: 'Photo-based' },
  ];

  return (
    <motion.div
      className="min-h-screen bg-[#FAFAF8] text-neutral-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sticky header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-neutral-200/80 bg-white/90 shadow-sm backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <motion.div
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5"
          >
            <motion.div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Sprout size={16} className="text-white" strokeWidth={2.5} />
            </motion.div>
            <span className="font-serif text-xl font-semibold tracking-tight text-neutral-900">Nouris</span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <button type="button" className="transition-colors hover:text-emerald-700" onClick={() => scrollToId('demo')}>
              See it in action
            </button>
            <button type="button" className="transition-colors hover:text-emerald-700" onClick={() => scrollToId('features')}>
              Features
            </button>
            <button type="button" className="transition-colors hover:text-emerald-700" onClick={() => scrollToId('faq')}>
              FAQ
            </button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => signInGoogle(true)}
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-emerald-700 sm:inline-flex"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => signInGoogle(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              Get started
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </header>

      {!canAuth && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
          Google sign-in needs <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code>. You can still get started locally
          without an account.
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-[#FAFAF8] to-amber-50/50" />
        <motion.div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-emerald-800 shadow-sm backdrop-blur-sm">
              <Sparkles size={14} className="text-emerald-600" />
              AI-powered nutrition tracking
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.5rem]">
              Understand every meal{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                in seconds
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-600">
              Snap a photo of your food. Get instant calories, macros, and health insights—then build a personal journal
              that grows with you.
            </p>
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                type="button"
                onClick={() => signInGoogle(false)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25"
              >
                {canAuth ? 'Sign up with Google' : 'Get started free'}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollToId('demo')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-8 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <Zap size={16} className="text-amber-500" />
                Watch demo
              </button>
            </motion.div>

            <div className="mt-10 flex flex-wrap gap-8 border-t border-neutral-200/60 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-semibold text-neutral-900">{s.value}</div>
                  <div className="text-sm text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero image collage */}
          <motion.div
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-emerald-400/20 to-amber-300/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/60 shadow-2xl shadow-neutral-900/10">
                <img
                  src="/images/landing/hero-meal-bowl.png"
                  alt="Healthy salmon grain bowl"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <motion.div
                  className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Salmon Grain Bowl</p>
                      <p className="text-xs text-neutral-500">Lunch · Just analyzed</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                      9
                    </div>
                  </motion.div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { v: '520', l: 'Cal' },
                      { v: '32g', l: 'Protein' },
                      { v: '48g', l: 'Carbs' },
                      { v: '9g', l: 'Fiber' },
                    ].map((m) => (
                      <div key={m.l} className="rounded-lg bg-neutral-50 py-1.5">
                        <div className="text-sm font-semibold text-neutral-900">{m.v}</div>
                        <div className="text-[10px] text-neutral-500">{m.l}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Floating thumbnails */}
              <motion.div
                className="absolute -left-6 top-8 hidden w-28 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:block"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <img src="/images/landing/demo-breakfast.png" alt="Breakfast" className="aspect-square object-cover" />
              </motion.div>
              <motion.div
                className="absolute -right-4 bottom-20 hidden w-32 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:block"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              >
                <img src="/images/landing/demo-salad.png" alt="Salad" className="aspect-square object-cover" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Food gallery strip */}
      <section className="border-y border-neutral-200/60 bg-white py-6">
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8">
          <span className="shrink-0 text-xs font-medium uppercase tracking-widest text-neutral-400">Works with any meal</span>
          <div className="flex gap-4">
            {foodGallery.map((item) => (
              <div key={item.label} className="group flex shrink-0 items-center gap-3 rounded-full border border-neutral-100 bg-neutral-50 py-1.5 pl-1.5 pr-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <img src={item.src} alt={item.label} className="h-10 w-10 rounded-full object-cover" />
                <span className="text-sm font-medium text-neutral-700 group-hover:text-emerald-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive demo */}
      <section id="demo" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeUp}>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-600">Interactive demo</p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              From photo to journal in four steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              See how Nouris turns a simple meal photo into structured nutrition data—no manual calorie counting required.
            </p>
          </motion.div>
          <div className="mt-16">
            <MealLogDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-neutral-200/60 bg-white py-20 lg:py-28">
        <motion.div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" {...fadeUp}>
          <div className="text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-600">Features</p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Everything in one place
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Built for people who want clarity—not another rigid diet app.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                className="group rounded-2xl border border-neutral-100 bg-[#FAFAF8] p-6 transition-all hover:border-neutral-200 hover:bg-white hover:shadow-lg hover:shadow-neutral-900/5"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Social proof */}
      <section className="relative overflow-hidden bg-neutral-900 py-20 text-white">
        <div className="absolute inset-0 opacity-20">
          <img src="/images/landing/hero-meal-bowl.png" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-neutral-900/80" />
        <motion.div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8" {...fadeUp}>
          <Shield className="mx-auto mb-6 text-emerald-400" size={40} strokeWidth={1.25} />
          <blockquote className="font-serif text-2xl font-medium leading-relaxed sm:text-3xl">
            &ldquo;We built Nouris for anyone who&rsquo;s tired of guessing what&rsquo;s on their plate—and wants honest,
            structured feedback without the lecture.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-neutral-400">Designed for real meals, real life, real data.</p>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
        <motion.div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8" {...fadeUp}>
          <div className="text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-600">FAQ</p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <motion.div className="mt-10 space-y-3">
            {faqs.map((item, i) => (
              <div
                key={item.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  openFaq === i ? 'border-emerald-200 bg-white shadow-sm' : 'border-neutral-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-neutral-900 sm:text-base"
                >
                  {item.q}
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-neutral-500 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-emerald-600' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    className="border-t border-neutral-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-neutral-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {item.a}
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-200/60 bg-white py-20">
        <motion.div
          className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-14 text-center shadow-xl shadow-emerald-600/20 sm:px-12">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <motion.div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
            <div className="relative">
              <Cloud className="mx-auto mb-4 text-emerald-200" size={36} strokeWidth={1.25} />
              <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">Ready to decode your next meal?</h2>
              <p className="mx-auto mt-3 max-w-md text-emerald-100">
                Create a free account with Google and start your synced meal journal in minutes.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => signInGoogle(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-50"
                >
                  {canAuth ? 'Sign up with Google' : 'Get started free'}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => signInGoogle(true)}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-8 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  {canAuth ? 'Log in with Google' : 'Continue without account'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-[#FAFAF8] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
              <Sprout size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-serif text-lg font-semibold text-neutral-900">Nouris</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600">
            <a href="#privacy" className="transition-colors hover:text-emerald-700" onClick={(e) => e.preventDefault()}>
              Privacy
            </a>
            <a href="#terms" className="transition-colors hover:text-emerald-700" onClick={(e) => e.preventDefault()}>
              Terms
            </a>
            <button type="button" className="transition-colors hover:text-emerald-700" onClick={() => signInGoogle(true)}>
              Log in
            </button>
          </div>
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Nouris. All rights reserved.</p>
        </div>
      </footer>
    </motion.div>
  );
}
