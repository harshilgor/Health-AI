import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Pencil, UserRound, X } from 'lucide-react';
import {
  ACTIVITY_OPTIONS,
  CONDITION_OPTIONS,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  calculateTargets,
  dietPreferenceLabel,
} from '../lib/profileTargets';

const fieldClass =
  'w-full rounded-xl border border-foreground/10 bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5';

const labelClass = 'font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted';

function OptionChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
              selected
                ? 'border-foreground bg-foreground text-background'
                : 'border-foreground/10 bg-card text-foreground hover:border-foreground/25'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-foreground/5 bg-card p-4">
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value ?? '—'}
        {value != null && unit ? (
          <span className="ml-1 text-xs font-normal text-muted">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

export default function ProfileView({ profile, email, onSave }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [draft, setDraft] = useState(profile || {});

  useEffect(() => {
    if (!editing) setDraft(profile || {});
  }, [profile, editing]);

  const previewTargets = useMemo(() => calculateTargets(draft), [draft]);

  const joinedLabel = profile?.joined
    ? new Date(profile.joined).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const startEdit = () => {
    setDraft({
      goal: profile?.goal || 'Eat healthier generally',
      conditions: profile?.conditions || 'None',
      age: profile?.age ?? 30,
      sex: profile?.sex || 'male',
      activity: profile?.activity || 'Lightly active',
      height_cm: profile?.height_cm ?? (profile?.sex === 'female' ? 160 : 175),
      weight_kg: profile?.weight_kg ?? (profile?.sex === 'female' ? 65 : 80),
      diet_preference: profile?.diet_preference || 'non_vegetarian',
      daily_calories: profile?.daily_calories,
      protein_target: profile?.protein_target,
      fat_target: profile?.fat_target,
      carb_target: profile?.carb_target,
      fiber_target: profile?.fiber_target,
    });
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setDraft(profile || {});
  };

  const updateField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const targets = calculateTargets(draft);
      const next = {
        ...profile,
        ...draft,
        age: Number(draft.age),
        height_cm: Number(draft.height_cm),
        weight_kg: Number(draft.weight_kg),
        ...targets,
      };
      await onSave(next);
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setError(e?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mb-2">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
          <p className="mt-2 text-sm text-muted max-w-xl">
            Keep your body metrics and goals up to date so calorie targets and coaching stay accurate.
          </p>
        </div>
        {!editing ? (
          <button type="button" onClick={startEdit} className="btn-primary inline-flex items-center gap-2 h-11">
            <Pencil size={16} /> Edit profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={cancelEdit} className="btn-secondary inline-flex items-center gap-2 h-11" disabled={saving}>
              <X size={16} /> Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary inline-flex items-center gap-2 h-11" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {savedFlash && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Profile updated. Your daily targets were recalculated.
        </motion.div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-3xl border border-foreground/5 bg-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.04] text-foreground">
            <UserRound size={26} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{email || 'Signed in'}</p>
            {joinedLabel && <p className="text-xs text-muted mt-1">Member since {joinedLabel}</p>}
          </div>
        </div>

        {!editing ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard label="Age" value={profile.age} unit="years" />
              <MetricCard label="Sex" value={profile.sex === 'female' ? 'Female' : 'Male'} />
              <MetricCard label="Activity" value={profile.activity} />
              <MetricCard label="Height" value={profile.height_cm} unit="cm" />
              <MetricCard label="Weight" value={profile.weight_kg} unit="kg" />
              <MetricCard label="Diet" value={dietPreferenceLabel(profile.diet_preference)} />
              <MetricCard label="Goal" value={profile.goal} />
            </div>

            <div className="rounded-2xl border border-foreground/5 bg-foreground/[0.02] p-5">
              <p className={labelClass}>Health conditions</p>
              <p className="mt-2 text-sm">{profile.conditions || 'None'}</p>
            </div>

            <div>
              <p className={`${labelClass} mb-3`}>Daily targets</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard label="Calories" value={profile.daily_calories} unit="kcal" />
                <MetricCard label="Protein" value={profile.protein_target} unit="g" />
                <MetricCard label="Carbs" value={profile.carb_target} unit="g" />
                <MetricCard label="Fat" value={profile.fat_target} unit="g" />
                <MetricCard label="Fiber" value={profile.fiber_target} unit="g" />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <p className={labelClass}>Primary goal</p>
              <OptionChips options={GOAL_OPTIONS} value={draft.goal} onChange={(v) => updateField('goal', v)} />
            </section>

            <section className="space-y-3">
              <p className={labelClass}>Health conditions</p>
              <OptionChips
                options={CONDITION_OPTIONS}
                value={draft.conditions}
                onChange={(v) => updateField('conditions', v)}
              />
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={labelClass} htmlFor="profile-age">Age</label>
                <input
                  id="profile-age"
                  type="number"
                  min={10}
                  max={120}
                  className={fieldClass}
                  value={draft.age}
                  onChange={(e) => updateField('age', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="profile-sex">Sex</label>
                <select
                  id="profile-sex"
                  className={fieldClass}
                  value={draft.sex}
                  onChange={(e) => updateField('sex', e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="profile-height">Height (cm)</label>
                <input
                  id="profile-height"
                  type="number"
                  min={100}
                  max={250}
                  className={fieldClass}
                  value={draft.height_cm}
                  onChange={(e) => updateField('height_cm', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="profile-weight">Weight (kg)</label>
                <input
                  id="profile-weight"
                  type="number"
                  min={30}
                  max={300}
                  step="0.1"
                  className={fieldClass}
                  value={draft.weight_kg}
                  onChange={(e) => updateField('weight_kg', e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <p className={labelClass}>Diet preference</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DIET_OPTIONS.map((opt) => {
                  const selected = draft.diet_preference === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('diet_preference', opt.value)}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-foreground/10 bg-card hover:border-foreground/25'
                      }`}
                    >
                      <p className="font-medium">{opt.label}</p>
                      <p className={`mt-1 text-xs ${selected ? 'text-background/70' : 'text-muted'}`}>{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <p className={labelClass}>Activity level</p>
              <OptionChips
                options={ACTIVITY_OPTIONS}
                value={draft.activity}
                onChange={(v) => updateField('activity', v)}
              />
            </section>

            <section>
              <p className={`${labelClass} mb-3`}>Updated daily targets (preview)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard label="Calories" value={previewTargets.daily_calories} unit="kcal" />
                <MetricCard label="Protein" value={previewTargets.protein_target} unit="g" />
                <MetricCard label="Carbs" value={previewTargets.carb_target} unit="g" />
                <MetricCard label="Fat" value={previewTargets.fat_target} unit="g" />
                <MetricCard label="Fiber" value={previewTargets.fiber_target} unit="g" />
              </div>
              <p className="mt-3 text-xs text-muted">
                Targets use Mifflin–St Jeor with your height, weight, age, sex, activity, and goal.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
