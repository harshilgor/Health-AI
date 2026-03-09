import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Brain, CheckCircle, AlertTriangle, Lightbulb, ShoppingCart, RefreshCw, ChevronRight } from 'lucide-react';
import { generateWeeklyReport } from '../lib/claude';

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
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
        </div>
    </div>
);

export default function WeeklyReport({ profile, meals = [] }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const weeklyMeals = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return meals.filter(m => new Date(m.date) > sevenDaysAgo);
    }, [meals]);

    const fetchReport = async () => {
        if (weeklyMeals.length < 3) {
            setError("Please log at least 3 meals this week to generate a meaningful report.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const apiKey = profile.api_key || import.meta.env.VITE_ANTHROPIC_API_KEY;
            const data = await generateWeeklyReport(apiKey, weeklyMeals);
            setReport(data);
        } catch (e) {
            setError("Failed to generate report. Please check your API key.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (weeklyMeals.length >= 3 && !report) {
            fetchReport();
        }
    }, [weeklyMeals]);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
                <div className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-2 animate-pulse">
                    <h2 className="text-2xl italic font-sans">Synthesizing your health data...</h2>
                    <p className="text-muted font-mono text-[10px] uppercase tracking-widest leading-relaxed">Cross-referencing nutritional markers across {weeklyMeals.length} logged meals</p>
                </div>
            </div>
        );
    }

    if (error || (weeklyMeals.length < 3)) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="p-6 bg-foreground/5 rounded-full text-muted">
                    <Activity size={48} />
                </div>
                <div className="space-y-4 max-w-sm">
                    <h2 className="text-3xl">Not enough data</h2>
                    <p className="text-muted italic leading-relaxed font-sans">Nouris needs at least 3 meals from the past 7 days to identify health patterns and calculate scores.</p>
                </div>
                <button onClick={() => window.location.hash = ''} className="btn-primary flex items-center gap-2">
                    LOG A MEAL <ChevronRight size={16} />
                </button>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-24">
            <div className="space-y-4 text-center">
                <div className="inline-block px-4 py-1 rounded-full border border-accent/20 text-accent font-mono text-[10px] uppercase tracking-[0.2em] mb-4 shadow-xl shadow-accent/5">
                    Nutrition Scientific Report
                </div>
                <h1 className="text-6xl text-balance leading-tight">Your Health Intelligence</h1>
                <p className="text-muted font-sans italic text-xl">Aggregated insights for week {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="space-y-12">
                    <div className="space-y-8">
                        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Health Dimensions</h3>
                        <div className="space-y-10">
                            <HealthBar label="Heart Health" icon={Heart} value={report.heart_health} color="bg-foreground" />
                            <HealthBar label="Metabolic Health" icon={Activity} value={report.metabolic_health} color="bg-foreground" />
                            <HealthBar label="Brain Health" icon={Brain} value={report.brain_health} color="bg-foreground" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Detected Patterns</h3>
                        <div className="space-y-4">
                            {report.patterns.map((p, i) => (
                                <div key={i} className="flex gap-4 items-start font-sans italic text-lg leading-snug">
                                    <span className="text-accent">◈</span> {p}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-12 bg-card-muted/30 p-10 rounded-[40px] border border-foreground/5 backdrop-blur-sm self-start">
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground">
                            <CheckCircle size={14} /> Weekly Wins
                        </h3>
                        <ul className="space-y-3">
                            {report.top_wins.map((w, i) => (
                                <li key={i} className="text-sm font-sans italic leading-relaxed text-foreground/80 pr-4">“{w}”</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-foreground/5">
                        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground">
                            <AlertTriangle size={14} /> Strategic Issues
                        </h3>
                        <ul className="space-y-3">
                            {report.top_issues.map((iss, i) => (
                                <li key={i} className="text-sm font-sans italic leading-relaxed text-foreground/80 opacity-80 pr-4">“{iss}”</li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-8 border-t border-foreground/5 space-y-6">
                        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-accent">
                            <ShoppingCart size={14} /> Intelligence Grocery List
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {report.grocery_suggestions.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-card border border-foreground/5 rounded-xl group hover:border-accent group transition-all">
                                    <div className="w-5 h-5 rounded-md border-2 border-foreground/10 group-hover:border-accent transition-colors shrink-0" />
                                    <span className="text-xs font-mono uppercase tracking-widest text-muted group-hover:text-foreground">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-12 bg-accent text-white rounded-[40px] relative overflow-hidden flex flex-col items-center text-center space-y-6 shadow-2xl shadow-accent/20">
                <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12 scale-150">
                    <Lightbulb size={120} />
                </div>
                <span className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.3em] backdrop-blur-md">Focus for Next Week</span>
                <h2 className="text-4xl text-balance leading-tight max-w-2xl px-4">{report.this_week_focus}</h2>
                <button onClick={fetchReport} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:underline pt-4 opacity-80">
                    <RefreshCw size={14} /> RE-ANALYZE WITH LATEST DATA
                </button>
            </div>
        </div>
    );
}
