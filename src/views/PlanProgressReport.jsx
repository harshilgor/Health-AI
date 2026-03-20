import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { getPlanProgress } from '../lib/plansApi';

const BADGE_CATALOG = [
  { key: 'first_week', name: 'First Week Down', icon: '🏅', description: '7 consecutive days on a plan' },
  { key: 'halfway', name: 'Halfway There', icon: '⏳', description: 'Reached day 15 of a 30-day plan' },
  { key: 'plan_complete', name: 'Plan Mastered', icon: '🏆', description: 'Completed a full nutrition plan' },
  { key: 'macro_perfect_7', name: 'Macro Perfectionist', icon: '🎯', description: '7 days hitting all macros within 10%' },
  { key: 'muscle_90', name: 'Muscle Master', icon: '💪', description: 'Muscle system reached 90%' },
  { key: 'three_plans', name: 'Plan Explorer', icon: '🗺️', description: 'Enrolled in 3 different plans' },
  { key: 'streak_30', name: 'Living Legend', icon: '👑', description: '30 days on any single plan' },
  { key: 'bio_age_reverse', name: 'Age Defier', icon: '🧬', description: 'Bio age decreased by 1+ year' },
];

function OrganChangeBar({ name, start, current, change }) {
  const barPct = Math.min(current, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize font-medium">{name}</span>
        <span className="text-muted">
          {start}% → {current}%
          {change !== 0 && (
            <span className={`ml-1 font-medium ${change > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              ({change > 0 ? '+' : ''}{change})
            </span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden relative">
        <div
          className="h-full rounded-full bg-foreground/20 absolute"
          style={{ width: `${Math.min(start, 100)}%` }}
        />
        <div
          className={`h-full rounded-full absolute transition-all duration-700 ${change >= 0 ? 'bg-emerald-500' : 'bg-rose-400'}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  );
}

function MacroAdherenceBar({ label, adherence, actual, target }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{actual}g avg / {target}g target ({adherence}%)</span>
      </div>
      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${adherence >= 80 ? 'bg-emerald-500' : adherence >= 50 ? 'bg-amber-500' : 'bg-rose-400'}`}
          style={{ width: `${Math.min(adherence, 100)}%` }}
        />
      </div>
    </div>
  );
}

function BadgeCard({ badge, unlocked }) {
  return (
    <div className={`rounded-xl border p-3 text-center space-y-1 ${unlocked ? 'border-accent/30 bg-accent/5' : 'border-foreground/10 bg-card opacity-60'}`}>
      <div className="text-2xl">{badge.icon}</div>
      <p className="text-xs font-semibold">{badge.name}</p>
      <p className="text-[10px] text-muted">{badge.description}</p>
      {unlocked ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
          <CheckCircle2 size={10} /> Unlocked
        </span>
      ) : (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted">
          <Lock size={10} /> Locked
        </span>
      )}
    </div>
  );
}

export default function PlanProgressReport({ token, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getPlanProgress(token)
      .then(setData)
      .catch((e) => console.error('Progress load:', e))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={32} className="animate-spin text-muted" />
        <p className="text-sm text-muted">Loading progress...</p>
      </div>
    );
  }

  if (!data || !data.plan) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted">No active plan progress to show.</p>
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
      </div>
    );
  }

  const { enrollment, plan, macroAverages, organChange, bioAgeChange, perfectDays, milestones, badges } = data;
  const unlockedKeys = new Set((badges || []).map((b) => b.badge_key));

  const organEntries = Object.entries(organChange || {});
  const totalAdherence = data.dailyProgress?.length
    ? Math.round(data.dailyProgress.reduce((s, d) => s + (d.adherence_score || 0), 0) / data.dailyProgress.length)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Your Transformation</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">{plan.name}</h1>
        <p className="text-sm text-muted mt-1">
          Day {enrollment.current_day} of {plan.duration_days} &middot; {perfectDays} perfect days
        </p>
      </motion.div>

      {organEntries.length > 0 && (
        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold">Organ Health Changes</h2>
          {organEntries.map(([key, val]) => (
            <OrganChangeBar key={key} name={key} start={val.start} current={val.current} change={val.change} />
          ))}
        </div>
      )}

      {bioAgeChange != null && (
        <div className="rounded-2xl border border-foreground/10 bg-card p-5 text-center space-y-2">
          <h2 className="text-base font-semibold">Biological Age</h2>
          <p className="text-4xl font-semibold">
            {bioAgeChange < 0 ? (
              <span className="text-emerald-600">{bioAgeChange.toFixed(1)} years</span>
            ) : bioAgeChange > 0 ? (
              <span className="text-rose-500">+{bioAgeChange.toFixed(1)} years</span>
            ) : (
              <span className="text-muted">No change</span>
            )}
          </p>
          {bioAgeChange < 0 && <p className="text-sm text-emerald-600">You're aging in reverse!</p>}
        </div>
      )}

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Macro Adherence (Daily Average)</h2>
        <MacroAdherenceBar label="Protein" adherence={macroAverages.protein.adherence || 0} actual={macroAverages.protein.actual} target={macroAverages.protein.target} />
        <MacroAdherenceBar label="Carbs" adherence={macroAverages.carbs.adherence || 0} actual={macroAverages.carbs.actual} target={macroAverages.carbs.target} />
        <MacroAdherenceBar label="Fat" adherence={macroAverages.fat.adherence || 0} actual={macroAverages.fat.actual} target={macroAverages.fat.target} />
        <p className="text-xs text-muted text-center">Overall adherence: {totalAdherence}%</p>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Milestones</h2>
        {milestones.map((m) => (
          <div key={m.day} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${m.unlocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-foreground/5 text-muted'}`}>
              {m.unlocked ? <CheckCircle2 size={16} /> : <Lock size={14} />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${m.unlocked ? '' : 'text-muted'}`}>{m.title}</p>
              <p className="text-xs text-muted">Day {m.day}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Trophy size={16} /> Achievements
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGE_CATALOG.map((badge) => (
            <BadgeCard key={badge.key} badge={badge} unlocked={unlockedKeys.has(badge.key)} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-card p-5">
        <h2 className="text-base font-semibold mb-3">Daily Adherence Log</h2>
        <div className="flex gap-1 flex-wrap">
          {(data.dailyProgress || []).map((d, i) => {
            const s = d.adherence_score || 0;
            const color = s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-400' : s > 0 ? 'bg-rose-400' : 'bg-foreground/10';
            return (
              <div
                key={i}
                className={`w-5 h-5 rounded-sm ${color}`}
                title={`${d.date}: ${s}% adherence`}
              />
            );
          })}
        </div>
        <p className="text-xs text-muted mt-2">Each square = one day. Green = 80%+, Yellow = 50-79%, Red = below 50%</p>
      </div>
    </div>
  );
}
