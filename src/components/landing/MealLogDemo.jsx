import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, CheckCircle2, BookOpen, ChevronRight } from 'lucide-react';

const STEPS = ['upload', 'analyze', 'results', 'journal'];

const DEMO_MEALS = [
  {
    id: 'salad',
    image: '/images/landing/demo-salad.png',
    name: 'Grilled Chicken Salad',
    mealType: 'Lunch',
    calories: 485,
    protein: 38,
    carbs: 28,
    fat: 22,
    fiber: 9,
    score: 8,
    insights: ['High protein supports muscle recovery', 'Good fiber from chickpeas & greens'],
  },
  {
    id: 'breakfast',
    image: '/images/landing/demo-breakfast.png',
    name: 'Avocado Toast & Eggs',
    mealType: 'Breakfast',
    calories: 420,
    protein: 18,
    carbs: 32,
    fat: 26,
    fiber: 8,
    score: 7,
    insights: ['Healthy fats from avocado', 'Balanced morning macros'],
  },
];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  return (
    <motion.div
      className="h-1 rounded-full bg-emerald-100"
      initial={{ width: 0 }}
      animate={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
      transition={{ duration: 0.4 }}
    />
  );
}

function UploadStep({ meal, onNext }) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center"
    >
      <motion.div
        className="relative w-full max-w-xs overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50"
        animate={{ borderColor: ['#6ee7b7', '#34d399', '#6ee7b7'] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <img src={meal.image} alt={meal.name} className="aspect-[4/3] w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
          <div className="rounded-full bg-white/90 p-3 shadow-lg">
            <Camera size={24} className="text-emerald-700" />
          </div>
        </div>
      </motion.div>
      <p className="mt-4 text-sm font-medium text-neutral-700">Tap to add meal photo</p>
      <button
        type="button"
        onClick={onNext}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Analyze this meal <ChevronRight size={16} />
      </button>
    </motion.div>
  );
}

function AnalyzeStep({ meal }) {
  return (
    <motion.div
      key="analyze"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center"
    >
      <motion.div
        className="relative w-full max-w-xs overflow-hidden rounded-2xl"
        animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.4)', '0 0 0 12px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0.4)'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <img src={meal.image} alt={meal.name} className="aspect-[4/3] w-full object-cover" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <motion.div
          className="absolute inset-x-0 top-0 h-1 bg-emerald-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>
      <div className="mt-5 flex items-center gap-2 text-emerald-700">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={18} />
        </motion.div>
        <span className="text-sm font-medium">AI analyzing your meal…</span>
      </div>
    </motion.div>
  );
}

function ResultsStep({ meal }) {
  const macros = [
    { label: 'Calories', value: meal.calories, unit: 'kcal' },
    { label: 'Protein', value: meal.protein, unit: 'g' },
    { label: 'Carbs', value: meal.carbs, unit: 'g' },
    { label: 'Fat', value: meal.fat, unit: 'g' },
  ];

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-sm"
    >
      <motion.div
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="relative">
          <img src={meal.image} alt={meal.name} className="aspect-[16/9] w-full object-cover" />
          <div className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-lg font-bold text-emerald-700 shadow-md">
            {meal.score}
          </div>
        </div>
        <motion.div
          className="p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start justify-between gap-2">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h4 className="font-semibold text-neutral-900">{meal.name}</h4>
              <p className="text-xs text-neutral-500">{meal.mealType}</p>
            </motion.div>
          </div>
          <motion.div
            className="mt-4 grid grid-cols-4 gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {macros.map((m) => (
              <motion.div
                key={m.label}
                className="rounded-xl bg-neutral-50 py-2 text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + macros.indexOf(m) * 0.08, type: 'spring' }}
              >
                <motion.div
                  className="text-base font-semibold text-neutral-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + macros.indexOf(m) * 0.1 }}
                >
                  {m.value}
                </motion.div>
                <motion.div className="text-[9px] font-medium uppercase tracking-wider text-neutral-500">
                  {m.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
          <motion.ul
            className="mt-4 space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {meal.insights.map((insight) => (
              <li key={insight} className="flex items-start gap-2 text-xs text-neutral-600">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                {insight}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function JournalStep({ meals }) {
  return (
    <motion.div
      key="journal"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-sm"
    >
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
        <motion.div
          className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <BookOpen size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-neutral-900">Today&apos;s Journal</span>
        </motion.div>
        <div className="divide-y divide-neutral-100 p-2">
          {meals.map((m, i) => (
            <motion.div
              key={m.id}
              className="flex items-center gap-3 rounded-xl p-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <img src={m.image} alt={m.name} className="h-14 w-14 rounded-lg object-cover" />
              <motion.div className="min-w-0 flex-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.15 }}>
                <p className="truncate text-sm font-medium text-neutral-900">{m.name}</p>
                <p className="text-xs text-neutral-500">{m.mealType} · {m.calories} kcal</p>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
              >
                <CheckCircle2 size={18} className="text-emerald-600" />
              </motion.div>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="border-t border-neutral-100 bg-emerald-50 px-4 py-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs font-medium text-emerald-800">Meal saved to your journal</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

const STEP_LABELS = {
  upload: { num: 1, title: 'Snap your meal', desc: 'Take a photo or upload from your gallery' },
  analyze: { num: 2, title: 'AI analyzes', desc: 'Instant nutrition breakdown in seconds' },
  results: { num: 3, title: 'See insights', desc: 'Macros, calories, and health notes' },
  journal: { num: 4, title: 'Log & track', desc: 'Saved to your personal meal journal' },
};

export default function MealLogDemo() {
  const [step, setStep] = useState('upload');
  const [mealIndex, setMealIndex] = useState(0);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const meal = DEMO_MEALS[mealIndex];

  const advance = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      const next = STEPS[idx + 1];
      if (next === 'journal') {
        setLoggedMeals((prev) => (prev.some((m) => m.id === meal.id) ? prev : [...prev, meal]));
      }
      setStep(next);
    } else {
      setMealIndex((i) => (i + 1) % DEMO_MEALS.length);
      setStep('upload');
    }
  }, [step, meal]);

  useEffect(() => {
    if (step === 'upload') return undefined;
    const delays = { analyze: 2500, results: 4000, journal: 3500 };
    const delay = delays[step];
    if (!delay) return undefined;
    const timer = setTimeout(advance, delay);
    return () => clearTimeout(timer);
  }, [step, advance]);

  const goToStep = (s) => {
    setStep(s);
    if (s === 'journal' && !loggedMeals.some((m) => m.id === meal.id)) {
      setLoggedMeals((prev) => [...prev, meal]);
    }
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        {/* Step indicators */}
        <div className="space-y-3">
          {STEPS.map((s) => {
            const info = STEP_LABELS[s];
            const isActive = step === s;
            const isPast = STEPS.indexOf(s) < STEPS.indexOf(step);
            return (
              <button
                key={s}
                type="button"
                onClick={() => goToStep(s)}
                className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50 shadow-sm'
                    : isPast
                      ? 'border-neutral-200 bg-white hover:border-emerald-100'
                      : 'border-neutral-100 bg-neutral-50/50 hover:border-neutral-200'
                }`}
              >
                <motion.div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isActive ? 'bg-emerald-600 text-white' : isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'
                  }`}
                  animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {isPast && !isActive ? <CheckCircle2 size={18} /> : info.num}
                </motion.div>
                <div>
                  <p className={`font-semibold ${isActive ? 'text-emerald-900' : 'text-neutral-900'}`}>{info.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">{info.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/40 via-transparent to-amber-100/40 blur-2xl" />
          <motion.div
            className="relative overflow-hidden rounded-[2rem] border-[6px] border-neutral-800 bg-neutral-900 shadow-2xl"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-center bg-neutral-800 py-2">
              <div className="h-1 w-16 rounded-full bg-neutral-600" />
            </div>
            <div className="bg-white px-4 pb-6 pt-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">Nouris</span>
                <span className="text-xs text-neutral-400">Demo</span>
              </div>
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-neutral-100">
                <ProgressBar step={step} />
              </div>
              <div className="flex min-h-[340px] items-center justify-center">
                <AnimatePresence mode="wait">
                  {step === 'upload' && <UploadStep meal={meal} onNext={advance} />}
                  {step === 'analyze' && <AnalyzeStep meal={meal} />}
                  {step === 'results' && <ResultsStep meal={meal} />}
                  {step === 'journal' && <JournalStep meals={loggedMeals.length ? loggedMeals : [meal]} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
