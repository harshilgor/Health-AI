import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Clock, Loader2, Utensils, ChevronRight, Flame } from 'lucide-react';
import { getPlanDetail, enrollInPlan } from '../lib/plansApi';

function MacroBar({ label, pct, color }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DifficultyMeter({ level }) {
  const map = { beginner: 2, intermediate: 3, advanced: 4 };
  const n = map[level] || 3;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`w-3 h-3 rounded-full ${i <= n ? 'bg-foreground' : 'bg-foreground/15'}`} />
      ))}
    </div>
  );
}

export default function PlanDetail({ slug, token, onBack, onEnrolled }) {
  const [plan, setPlan] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    getPlanDetail(token, slug)
      .then((data) => {
        setPlan(data.plan);
        setEnrollment(data.enrollment);
      })
      .catch((e) => console.error('Plan detail load:', e))
      .finally(() => setLoading(false));
  }, [slug, token]);

  const handleEnroll = async () => {
    if (!plan || enrolling) return;
    setEnrolling(true);
    try {
      await enrollInPlan(token, plan.plan_id);
      onEnrolled();
    } catch (e) {
      console.error('Enroll error:', e);
      alert(e.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Plan not found.</p>
        <button type="button" onClick={onBack} className="btn-secondary mt-4">Back to Plans</button>
      </div>
    );
  }

  const mealSlots = Array.isArray(plan.meal_timing) ? plan.meal_timing : [];
  const results = plan.expected_results || {};
  const resultEntries = Object.entries(results);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back to Plans
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted capitalize">{plan.category}</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">{plan.name}</h1>
        <p className="text-sm text-muted mt-1">Inspired by {plan.inspired_by}</p>
        <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{plan.description}</p>
      </motion.div>

      {mealSlots.length > 0 && (
        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold">What You'll Eat</h2>
          {mealSlots.map((slot, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <Utensils size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{slot.label}</span>
                  <span className="text-xs text-muted">{slot.time}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">{slot.example}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Target Macros Per Day</h2>
        <MacroBar label="Protein" pct={plan.protein_pct} color="bg-blue-500" />
        <MacroBar label="Carbs" pct={plan.carbs_pct} color="bg-amber-500" />
        <MacroBar label="Fat" pct={plan.fat_pct} color="bg-rose-400" />
        <p className="text-xs text-muted text-center pt-1">
          Based on ~2,500 kcal/day (adjusted to your profile after enrollment)
        </p>
      </div>

      {resultEntries.length > 0 && (
        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Expected Results</h2>
          {resultEntries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
                <ChevronRight size={12} />
              </div>
              <div>
                <span className="text-xs font-medium capitalize">{key.replace(/(\d)/g, ' $1')}</span>
                <p className="text-xs text-muted">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-foreground/10 bg-card p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted mb-1">Difficulty</p>
            <div className="flex justify-center"><DifficultyMeter level={plan.difficulty} /></div>
            <p className="text-xs font-medium capitalize mt-1">{plan.difficulty}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Strictness</p>
            <div className="flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= plan.strictness ? 'bg-foreground' : 'bg-foreground/15'}`} />
              ))}
            </div>
            <p className="text-xs font-medium mt-1">{plan.strictness}/5</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Duration</p>
            <p className="text-lg font-semibold">{plan.duration_days}</p>
            <p className="text-xs font-medium">days</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted px-1">
        <span className="flex items-center gap-1"><Users size={14} /> {plan.enrollment_count || 0} users following</span>
        {plan.primary_organ && (
          <span className="flex items-center gap-1">
            <Flame size={14} /> Garden focus: <span className="capitalize font-medium text-foreground">{plan.primary_organ}</span>
            {plan.secondary_organ && <span className="capitalize">+ {plan.secondary_organ}</span>}
          </span>
        )}
      </div>

      {enrollment ? (
        <button type="button" onClick={onEnrolled} className="btn-primary w-full h-14 text-base flex items-center justify-center gap-2">
          Continue Plan <ChevronRight size={20} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleEnroll}
          disabled={enrolling}
          className="btn-primary w-full h-14 text-base flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {enrolling ? <Loader2 size={20} className="animate-spin" /> : <Clock size={20} />}
          {enrolling ? 'Enrolling...' : `Start ${plan.duration_days}-Day Challenge`}
        </button>
      )}
    </div>
  );
}
