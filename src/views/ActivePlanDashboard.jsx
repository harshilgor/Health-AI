import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, Loader2, Sparkles, X, ArrowLeft, Flame } from 'lucide-react';
import { suggestPlanMeal } from '../lib/plansApi';

function MacroProgress({ label, actual, target, color }) {
  const pct = target > 0 ? Math.min(Math.round((actual / target) * 100), 150) : 0;
  const barPct = Math.min(pct, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{Math.round(actual)}/{target}g</span>
      </div>
      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}

function AdherenceBar({ label, pct }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SuggestionCard({ meal, tier }) {
  const [showRecipe, setShowRecipe] = useState(false);
  const tierMap = {
    perfect: { badge: 'Perfect Match', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
    good: { badge: 'Good Alternative', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
    okay: { badge: 'Decent Option', color: 'bg-foreground/5 text-muted border-foreground/10' },
  };
  const t = tierMap[tier] || tierMap.okay;

  return (
    <div className="rounded-xl border border-foreground/10 bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${t.color}`}>{t.badge}</span>
          <h4 className="text-sm font-semibold mt-1.5">{meal.name}</h4>
        </div>
        <span className="text-xs text-muted shrink-0">{meal.macros.calories} kcal</span>
      </div>
      <div className="flex gap-3 text-xs text-muted">
        <span>P: {meal.macros.protein}g</span>
        <span>C: {meal.macros.carbs}g</span>
        <span>F: {meal.macros.fat}g</span>
        <span className="ml-auto">{meal.prepTime}</span>
      </div>
      {meal.recipe && (
        <>
          <button type="button" onClick={() => setShowRecipe(!showRecipe)} className="text-xs text-accent underline">
            {showRecipe ? 'Hide recipe' : 'View recipe'}
          </button>
          <AnimatePresence>
            {showRecipe && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-muted leading-relaxed"
              >
                {meal.recipe}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function ActivePlanDashboard({
  activePlan,
  token,
  onScan,
  onViewProgress,
  onBack,
  onQuit,
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestSlot, setSuggestSlot] = useState(null);

  if (!activePlan) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted">No active plan.</p>
        <button type="button" onClick={onBack} className="btn-secondary">Browse Plans</button>
      </div>
    );
  }

  const { enrollment, plan, todayProgress, weekAdherence, overallAdherence, currentGarden } = activePlan;
  const tp = todayProgress || {};
  const macrosActual = tp.macros_actual || { protein: 0, carbs: 0, fat: 0, calories: 0 };
  const macrosTarget = tp.macros_target || { protein: 0, carbs: 0, fat: 0, calories: 0 };
  const mealsCompleted = tp.meals_completed || 0;
  const mealsTarget = tp.meals_target || plan.meals_per_day || 3;
  const mealPct = mealsTarget > 0 ? Math.round((mealsCompleted / mealsTarget) * 100) : 0;

  const startOrgan = enrollment.starting_organ_health || {};
  const primaryOrgan = plan.primary_organ;
  const organStart = startOrgan[primaryOrgan] ?? 50;
  const organNow = currentGarden?.[primaryOrgan] ?? 50;
  const organDelta = organNow - organStart;

  const bioStart = enrollment.starting_bio_age != null ? Number(enrollment.starting_bio_age) : null;
  const bioNow = currentGarden?.biological_age != null ? Number(currentGarden.biological_age) : null;
  const bioDelta = bioStart != null && bioNow != null ? bioNow - bioStart : null;

  const mealSlots = Array.isArray(plan.meal_timing) ? plan.meal_timing : [];
  const nextSlot = mealSlots[mealsCompleted] || mealSlots[0] || { slot: 'lunch', label: 'Next Meal' };

  const loadSuggestions = async (slot) => {
    if (!token) return;
    setSuggestLoading(true);
    setSuggestSlot(slot);
    try {
      const data = await suggestPlanMeal(token, slot);
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('Suggest error:', e);
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-2">
            <ArrowLeft size={14} /> All Plans
          </button>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{plan.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
            Day {enrollment.current_day} of {plan.duration_days}
          </h1>
        </div>
        <button type="button" onClick={onQuit} className="text-xs text-muted hover:text-rose-500 underline shrink-0 mt-1">
          Quit Plan
        </button>
      </div>

      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${Math.min(Math.round((enrollment.current_day / plan.duration_days) * 100), 100)}%` }}
        />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Today's Progress</h2>
          <span className="text-xs text-muted">Meals: {mealsCompleted}/{mealsTarget}</span>
        </div>
        <div className="h-3 rounded-full bg-foreground/10 overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.min(mealPct, 100)}%` }} />
        </div>
        <MacroProgress label="Protein" actual={macrosActual.protein} target={macrosTarget.protein} color="bg-blue-500" />
        <MacroProgress label="Carbs" actual={macrosActual.carbs} target={macrosTarget.carbs} color="bg-amber-500" />
        <MacroProgress label="Fat" actual={macrosActual.fat} target={macrosTarget.fat} color="bg-rose-400" />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Next: {nextSlot.label}</h2>
            {nextSlot.time && <p className="text-xs text-muted">{nextSlot.time}</p>}
          </div>
          <Sparkles size={16} className="text-accent" />
        </div>

        {!suggestions && !suggestLoading && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => loadSuggestions(nextSlot.slot || 'lunch')}
              className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> Get AI Meal Suggestions
            </button>
            <button type="button" onClick={onScan} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
              <Camera size={14} /> Scan My Meal Instead
            </button>
          </div>
        )}

        {suggestLoading && (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 size={18} className="animate-spin text-muted" />
            <span className="text-sm text-muted">Generating suggestions...</span>
          </div>
        )}

        {suggestions && !suggestLoading && (
          <div className="space-y-3">
            {suggestions.map((meal, i) => (
              <SuggestionCard
                key={i}
                meal={meal}
                tier={meal.planAdherence >= 90 ? 'perfect' : meal.planAdherence >= 70 ? 'good' : 'okay'}
              />
            ))}
            <button type="button" onClick={onScan} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
              <Camera size={14} /> Scan My Meal Instead
            </button>
            <button
              type="button"
              onClick={() => { setSuggestions(null); setSuggestSlot(null); }}
              className="text-xs text-muted underline w-full text-center"
            >
              Dismiss suggestions
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold">Plan Adherence</h2>
        <AdherenceBar label="This Week" pct={weekAdherence} />
        <AdherenceBar label="Overall" pct={overallAdherence} />
      </div>

      {primaryOrgan && (
        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Flame size={16} /> Physique Progress
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted capitalize">{primaryOrgan} System</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-semibold">{organNow}%</span>
                {organDelta !== 0 && (
                  <span className={`text-xs font-medium ${organDelta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {organDelta > 0 ? '+' : ''}{organDelta}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted">started at {organStart}%</p>
            </div>
            {bioDelta != null && (
              <div>
                <p className="text-xs text-muted">Bio Age</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-semibold">{bioNow.toFixed(1)}y</span>
                  <span className={`text-xs font-medium ${bioDelta < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {bioDelta < 0 ? '' : '+'}{bioDelta.toFixed(1)}y
                  </span>
                </div>
                <p className="text-[10px] text-muted">started at {bioStart.toFixed(1)}y</p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onViewProgress}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        View Full Progress Report <ChevronRight size={16} />
      </button>
    </div>
  );
}
