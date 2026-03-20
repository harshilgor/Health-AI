import React from 'react';
import { motion } from 'framer-motion';
import { ORGAN_META } from '../components/garden/OrganPlants';
import { TrendingUp, TrendingDown, Minus, Sprout, Flame } from 'lucide-react';

function barClass(pct) {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-400';
}

export default function GardenInsights({ garden, environment, profile, meals = [], onOpenWeekly }) {
  const g = garden || {};
  const chrono = Number(g.chronological_age ?? profile?.age ?? 30);
  const bio = g.biological_age != null ? Number(g.biological_age) : chrono;
  const delta = Number((chrono - bio).toFixed(2));
  const organs = ['heart', 'brain', 'gut', 'muscle', 'immune', 'bones'];
  const unlocked = organs.filter((k) => k !== 'bones' || g.bones_unlocked);
  const avg =
    unlocked.reduce((s, k) => s + Number(g[k] ?? 50), 0) / Math.max(1, unlocked.length);

  const envLabel = {
    clear: 'Clear sky — low inflammation signals',
    partly: 'Partly cloudy — mixed patterns',
    foggy: 'Foggy — inflammatory cues in recent meals',
    rainy: 'Rainy — room to improve choices',
  };

  const recentMeals = (meals || []).slice(0, 14);
  const avgHealthFromMeals =
    recentMeals.length > 0
      ? recentMeals.reduce((s, m) => s + Number(m?.fullAnalysis?.health_score ?? m?.health_score ?? 5), 0) /
        recentMeals.length
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-24 md:pb-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Insights</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Body stats</h1>
        <p className="text-sm text-muted mt-2">
          Educational view — not a medical diagnosis. Trends come from your logged meals and garden model.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8 space-y-4"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">Biological age (model)</h2>
            <p className="text-xs text-muted mt-1">Moves with meal quality: better choices → lower number.</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-semibold tabular-nums">{bio.toFixed(1)}</div>
            <div className="text-xs text-muted">years (model)</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <div className="text-muted text-xs uppercase tracking-wide">Chronological</div>
            <div className="text-2xl font-medium mt-1">{chrono} yrs</div>
          </div>
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <div className="text-muted text-xs uppercase tracking-wide">Difference</div>
            <div className="text-2xl font-medium mt-1 flex items-center gap-2">
              {delta > 0.05 ? (
                <>
                  <TrendingDown className="text-emerald-500" size={22} />
                  {delta.toFixed(1)} yrs younger
                </>
              ) : delta < -0.05 ? (
                <>
                  <TrendingUp className="text-rose-500" size={22} />
                  {Math.abs(delta).toFixed(1)} yrs older
                </>
              ) : (
                <>
                  <Minus size={22} className="text-muted" />
                  Aligned with age
                </>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <section className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sprout size={20} className="text-foreground" />
          <h2 className="text-lg font-semibold">Garden environment</h2>
        </div>
        <p className="text-sm text-foreground/80">{envLabel[environment] || envLabel.partly}</p>
        <p className="text-xs text-muted">
          Overall garden average: <span className="font-medium text-foreground">{Math.round(avg)}%</span>
        </p>
      </section>

      <section className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-orange-500" />
          <h2 className="text-lg font-semibold">Streaks & unlocks</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border border-foreground/10 p-4">
            <div className="text-muted text-xs">Current streak</div>
            <div className="text-2xl font-semibold mt-1">{g.current_streak ?? 0} days</div>
          </div>
          <div className="rounded-xl border border-foreground/10 p-4">
            <div className="text-muted text-xs">Best streak</div>
            <div className="text-2xl font-semibold mt-1">{g.longest_streak ?? 0} days</div>
          </div>
          <div className="rounded-xl border border-foreground/10 p-4">
            <div className="text-muted text-xs">Distinct log days</div>
            <div className="text-2xl font-semibold mt-1">{g.distinct_meal_days ?? 0}</div>
            <div className="text-xs text-muted mt-1">Unlock bones at 30 days</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8 space-y-5">
        <h2 className="text-lg font-semibold">All systems</h2>
        <div className="space-y-4">
          {organs.map((key) => {
            const meta = ORGAN_META[key];
            const locked = key === 'bones' && !g.bones_unlocked;
            const pct = locked ? null : Math.round(Number(g[key] ?? 50));
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium shrink-0">
                  {meta.label}
                  {locked && <span className="block text-[10px] text-muted font-normal">Locked</span>}
                </div>
                <div className="flex-1 h-2.5 rounded-full bg-foreground/10 overflow-hidden">
                  {!locked && (
                    <div
                      className={`h-full rounded-full transition-all ${barClass(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                <div className="w-12 text-right text-sm tabular-nums text-muted">
                  {locked ? '🔒' : `${pct}%`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {avgHealthFromMeals != null && (
        <section className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
          <h2 className="text-lg font-semibold mb-2">Recent meal health scores</h2>
          <p className="text-sm text-muted mb-4">Average health score (1–10) over last {recentMeals.length} meals.</p>
          <div className="text-3xl font-semibold">{avgHealthFromMeals.toFixed(1)}</div>
        </section>
      )}

      {onOpenWeekly && (
        <button type="button" onClick={onOpenWeekly} className="btn-secondary w-full sm:w-auto">
          Open weekly report
        </button>
      )}
    </div>
  );
}
