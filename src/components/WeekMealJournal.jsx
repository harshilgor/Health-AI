import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, UtensilsCrossed } from 'lucide-react';

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function MealCard({ meal }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-foreground/10 bg-card p-3">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-card-muted shrink-0">
        {meal.image ? (
          <img src={meal.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <UtensilsCrossed size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{meal.meal_name || 'Meal'}</h4>
          <span className="text-xs font-mono shrink-0 bg-foreground/5 px-2 py-0.5 rounded-full">
            {meal.health_score ?? '—'}/10
          </span>
        </div>
        <p className="text-xs text-muted mt-1 capitalize">{meal.meal_type || 'meal'}</p>
        <div className="flex gap-3 text-xs text-muted mt-2">
          <span>{meal.nutrition?.calories ?? 0} kcal</span>
          <span>{meal.nutrition?.protein_g ?? 0}g protein</span>
          <span>{new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}

export default function WeekMealJournal({ meals = [], onLogMeal }) {
  const weeklyMeals = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return meals
      .filter((m) => m.date && new Date(m.date) > sevenDaysAgo)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [meals]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const m of weeklyMeals) {
      const key = new Date(m.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    return Array.from(map.entries());
  }, [weeklyMeals]);

  const weekTotals = useMemo(
    () =>
      weeklyMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.nutrition?.calories || 0),
          protein: acc.protein + (m.nutrition?.protein_g || 0),
          meals: acc.meals + 1,
        }),
        { calories: 0, protein: 0, meals: 0 }
      ),
    [weeklyMeals]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-muted">
          <Calendar size={14} />
          Past 7 days
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Your meal journal</h2>
        <p className="text-sm text-muted">
          {weekTotals.meals} meal{weekTotals.meals === 1 ? '' : 's'} logged · {weekTotals.calories.toLocaleString()} kcal ·{' '}
          {weekTotals.protein}g protein
        </p>
      </div>

      {weeklyMeals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 p-10 text-center space-y-4">
          <p className="text-muted text-sm">No meals logged this week yet.</p>
          {onLogMeal && (
            <button type="button" onClick={onLogMeal} className="btn-primary">
              Log your first meal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {byDay.map(([dayKey, dayMeals]) => (
            <div key={dayKey} className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted">{dayLabel(dayMeals[0].date)}</h3>
              <div className="space-y-3">
                {dayMeals.map((m) => (
                  <motion.div key={m.id || m.meal_id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <MealCard meal={m} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
