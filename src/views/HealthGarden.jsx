import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';
import GardenCanvas from '../components/garden/GardenCanvas';
import { ORGAN_META } from '../components/garden/OrganPlants';

const ORGAN_TIPS = {
  heart: {
    focus: ['Omega-3 rich fish & nuts', 'Fiber from vegetables & legumes', 'Limit fried & ultra-processed foods'],
    avoid: ['Excess sodium patterns', 'Repeated trans-fat heavy meals'],
  },
  brain: {
    focus: ['Colorful produce & berries', 'Healthy fats & quality protein', 'Steady energy (balanced plates)'],
    avoid: ['Spikes from sugary drinks only meals'],
  },
  gut: {
    focus: ['Fermented foods when you tolerate them', 'Fiber diversity', 'Whole foods over packages'],
    avoid: ['Long stretches of only ultra-processed meals'],
  },
  muscle: {
    focus: ['Adequate protein across the day', 'Complex carbs around activity', 'Hydration'],
    avoid: ['Very low protein days repeated'],
  },
  immune: {
    focus: ['Micronutrient variety (fruits/veg)', 'Consistent sleep-friendly patterns', 'Protein adequacy'],
    avoid: ['Alcohol-heavy + low-produce streaks'],
  },
  bones: {
    focus: ['Calcium-containing foods', 'Vitamin D from diet & sun habits', 'Resistance training (outside app)'],
    avoid: ['Very low dairy/fortified alternatives long-term'],
  },
};

function statusLabel(pct) {
  if (pct >= 78) return { text: 'Thriving', className: 'text-emerald-600' };
  if (pct >= 55) return { text: 'Growing', className: 'text-amber-600' };
  if (pct >= 35) return { text: 'Needs care', className: 'text-orange-600' };
  return { text: 'Struggling', className: 'text-rose-600' };
}

function OrganDetailSheet({ organKey, garden, onClose, onScan }) {
  if (!organKey) return null;
  const meta = ORGAN_META[organKey];
  const Graphic = meta.Graphic;
  const locked = organKey === 'bones' && !garden?.bones_unlocked;
  const pct = locked ? 0 : Math.round(Number(garden?.[organKey] ?? 50));
  const st = locked ? { text: 'Locked', className: 'text-muted' } : statusLabel(pct);
  const tips = ORGAN_TIPS[organKey];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-md rounded-3xl border border-foreground/10 bg-background shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-foreground/10">
          <h2 className="text-lg font-semibold">
            {meta.label} · {meta.subtitle}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/5" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-center h-40">
            <Graphic health={locked ? 30 : pct} locked={locked} className="w-36 h-40" />
          </div>
          {!locked && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Vitality</span>
                  <span className={`font-semibold ${st.className}`}>
                    {pct}% · {st.text}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{ width: `${pct}%`, opacity: 0.85 }}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Focus areas</h3>
                <ul className="text-sm space-y-2 text-foreground/90">
                  {tips.focus.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 text-[10px]">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Watch outs</h3>
                <ul className="text-sm space-y-2 text-foreground/80">
                  {tips.avoid.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 text-[10px]">!</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {locked && (
            <p className="text-sm text-muted text-center">
              Log meals on <span className="font-medium text-foreground">30 different days</span> to unlock your bone
              pillars and start growing them with calcium-friendly choices.
            </p>
          )}
          <button type="button" onClick={onScan} className="btn-primary w-full flex items-center justify-center gap-2">
            <Camera size={18} /> Scan a meal to grow this plant
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HealthGarden({
  garden,
  environment,
  loading,
  profile,
  onScan,
  onRefresh,
}) {
  const [selected, setSelected] = useState(null);
  const g = garden || {};
  const chrono = Number(g.chronological_age ?? profile?.age ?? 30);
  const bio = g.biological_age != null ? Number(g.biological_age) : chrono;
  const streak = g.current_streak ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <p className="text-sm text-muted">Growing your garden...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Your health garden</p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">Grow with every meal</h1>
          <p className="text-sm text-muted mt-2 max-w-md">
            Each plant mirrors a body system. Log meals to water them — this is motivational, not medical advice.
          </p>
        </div>
        <button type="button" onClick={onRefresh}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors shrink-0"
          aria-label="Refresh garden"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-foreground/10 px-3 py-1.5 bg-card flex items-center gap-1.5">
          <span className="text-base leading-none">🔥</span>
          Streak: <strong>{streak}</strong> {streak === 1 ? 'day' : 'days'}
        </span>
        <span className="rounded-full border border-foreground/10 px-3 py-1.5 bg-card">
          Bio age: <strong>{bio.toFixed(1)}</strong>y
        </span>
        {bio < chrono && (
          <span className="rounded-full border border-emerald-200 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium">
            {(chrono - bio).toFixed(1)}y younger
          </span>
        )}
      </div>

      {/* Interactive Garden Scene */}
      <GardenCanvas
        garden={g}
        environment={environment}
        onOrganPress={(organ) => setSelected(organ)}
      />

      {/* Organ health summary bar */}
      <div className="grid grid-cols-6 gap-1.5">
        {['heart', 'brain', 'gut', 'muscle', 'immune', 'bones'].map((key) => {
          const locked = key === 'bones' && !g.bones_unlocked;
          const pct = locked ? 0 : Math.round(Number(g[key] ?? 50));
          const st = locked ? null : statusLabel(pct);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className="rounded-xl border border-foreground/10 bg-card p-2 text-center hover:border-foreground/20 transition-colors"
            >
              <div className="text-[10px] font-medium capitalize text-muted">{key}</div>
              {locked ? (
                <div className="text-[10px] text-muted mt-0.5">🔒</div>
              ) : (
                <div className={`text-xs font-semibold mt-0.5 ${st.className}`}>{pct}%</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Scan button */}
      <button type="button" onClick={onScan} className="btn-primary w-full h-14 text-base flex items-center justify-center gap-2">
        <Camera size={22} /> Scan meal
      </button>

      {/* Detail sheet */}
      <AnimatePresence>
        {selected && (
          <OrganDetailSheet
            organKey={selected}
            garden={g}
            onClose={() => setSelected(null)}
            onScan={() => {
              setSelected(null);
              onScan();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
