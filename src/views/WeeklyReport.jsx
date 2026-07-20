import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Brain, CheckCircle, AlertTriangle, Lightbulb, ShoppingCart, RefreshCw } from 'lucide-react';
import { generateWeeklyReport } from '../lib/claude';
import WeekMealJournal from '../components/WeekMealJournal';

const HealthBar = ({ label, icon: Icon, value, color }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
            <div className="flex items-center gap-2">
                <Icon size={14} className={color} />
                {label}
            </div>
            <span>{value}/10</span>
        </div>
        <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
            <motion.div
                className={`h-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${value * 10}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />
        </div>
    </div>
);

export default function WeeklyReport({ profile, meals = [], onLogMeal }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportError, setReportError] = useState(null);

    const weeklyMeals = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return meals.filter((m) => m.date && new Date(m.date) > sevenDaysAgo);
    }, [meals]);

    const fetchReport = async () => {
        if (weeklyMeals.length < 3) return;
        setLoading(true);
        setReportError(null);
        try {
            const apiKey = profile.api_key || import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_API_KEY;
            if (!apiKey) {
                setReportError('Add an Anthropic API key in settings to generate AI weekly insights.');
                return;
            }
            const data = await generateWeeklyReport(apiKey, weeklyMeals);
            setReport(data);
        } catch {
            setReportError('Failed to generate AI report. Your meals are still saved below.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (weeklyMeals.length >= 3 && !report && !reportError) {
            fetchReport();
        }
    }, [weeklyMeals.length]);

    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-24">
            <WeekMealJournal meals={meals} onLogMeal={onLogMeal} />

            {weeklyMeals.length >= 3 && (
                <div className="border-t border-foreground/10 pt-12 space-y-8">
                    <div className="space-y-2 text-center">
                        <div className="inline-block px-4 py-1 rounded-full border border-accent/20 text-accent font-mono text-[10px] uppercase tracking-[0.2em]">
                            AI Weekly Insights
                        </div>
                        <h2 className="text-3xl font-semibold tracking-tight">Health intelligence</h2>
                        <p className="text-sm text-muted">
                            Patterns across {weeklyMeals.length} meals this week
                        </p>
                    </div>

                    {loading && (
                        <div className="py-16 flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted italic">Synthesizing your health data...</p>
                        </div>
                    )}

                    {reportError && (
                        <div className="rounded-2xl border border-foreground/10 bg-card p-6 text-center space-y-3">
                            <p className="text-sm text-muted">{reportError}</p>
                            <button type="button" onClick={fetchReport} className="btn-secondary text-sm">
                                Try again
                            </button>
                        </div>
                    )}

                    {report && !loading && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div className="space-y-8">
                                        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Health dimensions</h3>
                                        <div className="space-y-8">
                                            <HealthBar label="Heart Health" icon={Heart} value={report.heart_health} color="bg-foreground" />
                                            <HealthBar label="Metabolic Health" icon={Activity} value={report.metabolic_health} color="bg-foreground" />
                                            <HealthBar label="Brain Health" icon={Brain} value={report.brain_health} color="bg-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Detected patterns</h3>
                                        {report.patterns.map((p, i) => (
                                            <div key={i} className="flex gap-3 text-sm italic text-foreground/90">
                                                <span className="text-accent">◈</span> {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-8 bg-card-muted/30 p-8 rounded-3xl border border-foreground/5">
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em]">
                                            <CheckCircle size={14} /> Weekly wins
                                        </h3>
                                        <ul className="space-y-2 text-sm italic text-foreground/80">
                                            {report.top_wins.map((w, i) => (
                                                <li key={i}>“{w}”</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-foreground/5">
                                        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em]">
                                            <AlertTriangle size={14} /> Strategic issues
                                        </h3>
                                        <ul className="space-y-2 text-sm italic text-foreground/70">
                                            {report.top_issues.map((iss, i) => (
                                                <li key={i}>“{iss}”</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-foreground/5">
                                        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-accent">
                                            <ShoppingCart size={14} /> Grocery list
                                        </h3>
                                        {report.grocery_suggestions.map((item, i) => (
                                            <div key={i} className="text-xs font-mono uppercase tracking-wider text-muted p-2 rounded-lg bg-card border border-foreground/5">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 bg-accent text-white rounded-3xl text-center space-y-4">
                                <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-80">Focus for next week</span>
                                <h3 className="text-2xl leading-snug">{report.this_week_focus}</h3>
                                <button type="button" onClick={fetchReport} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-80 hover:opacity-100">
                                    <RefreshCw size={14} /> Re-analyze
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {weeklyMeals.length > 0 && weeklyMeals.length < 3 && (
                <p className="text-center text-sm text-muted border-t border-foreground/10 pt-8">
                    Log {3 - weeklyMeals.length} more meal{3 - weeklyMeals.length === 1 ? '' : 's'} this week to unlock AI health insights.
                </p>
            )}
        </div>
    );
}
