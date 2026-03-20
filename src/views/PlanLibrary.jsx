import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Users, Loader2, Dumbbell, Dna, Brain, Heart } from 'lucide-react';

const CATEGORY_META = {
  physique: { label: 'Physique Goals', icon: Dumbbell, emoji: '💪' },
  longevity: { label: 'Longevity', icon: Dna, emoji: '🧬' },
  cognitive: { label: 'Cognitive', icon: Brain, emoji: '🧠' },
  recovery: { label: 'Recovery & Healing', icon: Heart, emoji: '🩺' },
};

const DIFFICULTY_LABELS = { beginner: 'Beginner', intermediate: 'Moderate', advanced: 'Advanced' };

function DifficultyDots({ level }) {
  const map = { beginner: 1, intermediate: 2, advanced: 3 };
  const n = map[level] || 2;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${i <= n ? 'bg-foreground' : 'bg-foreground/20'}`} />
      ))}
    </span>
  );
}

function StrictnessDots({ level }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-foreground' : 'bg-foreground/15'}`} />
      ))}
    </span>
  );
}

function PlanCard({ plan, onSelect }) {
  const keyBullets = (plan.key_foods || []).slice(0, 3);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(plan.slug)}
      className="w-full text-left rounded-2xl border border-foreground/10 bg-card p-5 hover:border-foreground/20 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{plan.name}</h3>
          <p className="text-sm text-muted mt-0.5">{plan.tagline}</p>
        </div>
        <ChevronRight size={18} className="text-muted shrink-0 mt-1" />
      </div>

      <div className="mt-3 space-y-1.5">
        {keyBullets.map((f) => (
          <div key={f} className="text-xs text-muted flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-foreground/30" />
            {f}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <DifficultyDots level={plan.difficulty} />
          <span className="ml-1">{DIFFICULTY_LABELS[plan.difficulty] || plan.difficulty}</span>
        </span>
        <span className="flex items-center gap-1">
          <StrictnessDots level={plan.strictness} />
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Users size={12} />
          {plan.enrollment_count || 0}
        </span>
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-foreground/5 text-muted">
          {plan.meals_per_day} meals/day
        </span>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-foreground/5 text-muted">
          {plan.duration_days} days
        </span>
        {plan.primary_organ && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-foreground/5 text-muted capitalize">
            {plan.primary_organ} focus
          </span>
        )}
      </div>
    </motion.button>
  );
}

export default function PlanLibrary({ plans, loading, onSelectPlan, activePlan, onGoToActive }) {
  const [expandedCat, setExpandedCat] = useState(null);

  const grouped = {};
  for (const p of plans || []) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  const categories = ['physique', 'longevity', 'cognitive', 'recovery'];

  useEffect(() => {
    if (!expandedCat && categories.some((c) => grouped[c]?.length)) {
      setExpandedCat(categories.find((c) => grouped[c]?.length) || null);
    }
  }, [plans]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={32} className="animate-spin text-muted" />
        <p className="text-sm text-muted">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Follow the Greats</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Nutrition Plans</h1>
        <p className="text-sm text-muted mt-2 max-w-md">
          Choose a plan inspired by elite performers. Get daily meal guidance, macro targets, and track your transformation.
        </p>
      </div>

      {activePlan && (
        <button
          type="button"
          onClick={onGoToActive}
          className="w-full rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left hover:bg-accent/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-accent font-medium uppercase tracking-wider">Active Plan</p>
              <p className="text-base font-semibold mt-0.5">{activePlan.plan?.name}</p>
              <p className="text-sm text-muted">Day {activePlan.enrollment?.current_day} of {activePlan.plan?.duration_days}</p>
            </div>
            <ChevronRight size={20} className="text-accent" />
          </div>
        </button>
      )}

      {categories.map((cat) => {
        const meta = CATEGORY_META[cat];
        const items = grouped[cat] || [];
        if (!items.length) return null;
        const isOpen = expandedCat === cat;
        const Icon = meta.icon;

        return (
          <div key={cat}>
            <button
              type="button"
              onClick={() => setExpandedCat(isOpen ? null : cat)}
              className="w-full flex items-center gap-3 py-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                <Icon size={16} strokeWidth={1.5} />
              </div>
              <span className="text-lg font-semibold flex-1">{meta.label}</span>
              <span className="text-lg mr-1">{meta.emoji}</span>
              <ChevronRight
                size={16}
                className={`text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 mt-1"
              >
                {items.map((p) => (
                  <PlanCard key={p.plan_id} plan={p} onSelect={onSelectPlan} />
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
