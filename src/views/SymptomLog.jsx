import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Zap, Smile, Search, Info, Plus, ChevronRight, CheckCircle } from 'lucide-react';
import { correlateSymptoms } from '../lib/claude';

const Slider = ({ value, label, icon: Icon, onChange }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-accent" />
                {label}
            </div>
            <span>{value}/5</span>
        </div>
        <input
            type="range" min="1" max="5" step="1"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-foreground/5 rounded-full appearance-none accent-accent cursor-pointer"
        />
        <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest px-1 text-muted">
            <span>Low</span>
            <span>Optimal</span>
        </div>
    </div>
);

export default function SymptomLog({ profile, logs = [], meals = [], onLog }) {
    const [entry, setEntry] = useState({ energy: 3, mood: 3, digestion: 'Good', notes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [insights, setInsights] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const save = () => {
        setIsSaving(true);
        onLog({ ...entry, date: new Date().toISOString() });
        setTimeout(() => {
            setIsSaving(false);
            setEntry({ energy: 3, mood: 3, digestion: 'Good', notes: '' });
        }, 1000);
    };

    const fetchInsights = async () => {
        if (logs.length < 7) return;
        setAnalyzing(true);
        try {
            const apiKey = profile.api_key || import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_API_KEY;
            const data = await correlateSymptoms(apiKey, meals, logs);
            setInsights(data);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-24">
            <div className="space-y-4">
                <h1 className="text-5xl">Daily Vitality Check</h1>
                <p className="text-muted text-xl font-sans italic max-w-lg">Track your symptoms to correlate nutritional patterns with energy and mood levels over time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="card space-y-10 p-10 bg-card/40">
                    <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Log Today's State</h3>

                    <Slider label="Energy Level" icon={Zap} value={entry.energy} onChange={v => setEntry({ ...entry, energy: v })} />
                    <Slider label="Emotional Mood" icon={Smile} value={entry.mood} onChange={v => setEntry({ ...entry, mood: v })} />

                    <div className="space-y-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted block mb-4">Digestion Quality</span>
                        <div className="grid grid-cols-3 gap-3">
                            {['Poor', 'Okay', 'Good'].map(d => (
                                <button key={d}
                                    className={`p-3 text-[10px] font-mono uppercase tracking-widest rounded-xl border transition-all ${entry.digestion === d ? 'border-accent bg-accent/10' : 'border-foreground/5 bg-foreground/5 opacity-60'}`}
                                    onClick={() => setEntry({ ...entry, digestion: d })}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted block">Notes</span>
                        <textarea
                            className="w-full bg-foreground/5 border border-foreground/5 rounded-xl p-4 text-sm font-sans italic text-foreground px-4 py-3 min-h-[100px] focus:outline-none focus:border-accent transition-colors"
                            placeholder="How do you feel? Any specific physical reactions today?"
                            value={entry.notes}
                            onChange={e => setEntry({ ...entry, notes: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={save}
                        disabled={isSaving}
                        className="btn-primary w-full h-14 flex items-center justify-center gap-2"
                    >
                        {isSaving ? <CheckCircle size={20} className="animate-pulse" /> : <>LOG VITALITY <Plus size={18} /></>}
                    </button>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Personalized Correlations</h3>
                        <p className="text-sm font-sans italic text-muted leading-relaxed">Nouris analyzes your meal logs alongside your symptom data to find causal patterns after 7 entries.</p>
                    </div>

                    <div className="p-1 pt-0">
                        {logs.length < 7 ? (
                            <div className="p-8 bg-card border border-foreground/5 rounded-[40px] text-center space-y-6">
                                <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto text-muted/40">
                                    <Thermometer size={32} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg italic font-sans opacity-80">{7 - logs.length} days until first insight</p>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Awaiting baseline data</p>
                                </div>
                                <div className="h-1 w-full bg-foreground/5 rounded-full">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(logs.length / 7) * 100}%` }} className="h-full bg-accent" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {!insights ? (
                                    <button
                                        onClick={fetchInsights}
                                        disabled={analyzing}
                                        className="bg-card w-full border border-accent/20 h-40 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:bg-accent/5 group transition-all"
                                    >
                                        {analyzing ? (
                                            <>
                                                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Analyzing Correlates...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search size={32} className="text-accent group-hover:scale-110 transition-transform" />
                                                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Calculate Correlations</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        {insights.map((ins, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="p-6 bg-accent/5 rounded-2xl border border-accent/20 flex gap-4"
                                            >
                                                <div className="shrink-0 pt-1"><Info size={18} className="text-accent" /></div>
                                                <p className="text-sm font-sans italic leading-relaxed text-foreground/90">{ins}</p>
                                            </motion.div>
                                        ))}
                                        <button onClick={fetchInsights} className="font-mono text-[8px] text-muted uppercase tracking-[0.3em] hover:text-accent ml-2">Re-run analysis</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
