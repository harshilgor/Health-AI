import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Info, CheckCircle2, Save, ChevronRight, Share2, Activity, ChevronDown, ChevronUp } from 'lucide-react';

const ScoreDial = ({ score }) => {
    const [currentScore, setCurrentScore] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setCurrentScore(score), 500);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="relative w-40 h-40 flex flex-col items-center justify-center p-8 bg-card-muted/50 rounded-full border border-foreground/5 backdrop-blur-md">
            <motion.div
                className="absolute inset-0 rounded-full border-4 border-foreground/5"
                initial={{ rotate: -90 }}
                animate={{ rotate: 90 }}
            />
            <motion.div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent"
                animate={{ rotate: (currentScore / 10) * 360 - 90 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />
            <div className="text-center">
                <span className="block text-5xl font-sans leading-none mb-1">{currentScore}</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">Health Score</span>
            </div>
        </div>
    );
};

const MacroCard = ({ label, value, unit, color }) => (
    <div className="card-muted !p-4 rounded-2xl border border-foreground/5 bg-foreground/5 hover:border-foreground/10 transition-colors">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted">{label}</span>
            <div className={`w-1 h-1 rounded-full ${color}`} />
        </div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-sans">{value}</span>
            <span className="text-[10px] font-mono uppercase text-muted">{unit}</span>
        </div>
    </div>
);

const CollapsibleSection = ({ title, defaultExpanded = true, children }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (
        <div className="space-y-4">
            <div
                className="flex items-center justify-between cursor-pointer md:cursor-default"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-foreground border-b border-foreground/10 pb-2 flex-grow">{title}</h3>
                <button className="md:hidden ml-4 text-muted hover:text-foreground">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>
            <div className={`md:block ${isExpanded ? 'block' : 'hidden'}`}>
                {children}
            </div>
        </div>
    );
};

const AffectsTag = ({ affect }) => (
    <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest bg-foreground/5 text-foreground border border-foreground/10">
        {affect.replace('_', ' ')}
    </span>
);

const BulletCard = ({ title, icon, bullets = [], defaultExpanded = true }) => (
    <CollapsibleSection title={`${icon} ${title}`} defaultExpanded={defaultExpanded}>
        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
            {bullets.length ? (
                <ul className="space-y-2">
                    {bullets.map((b, i) => (
                        <li key={`${title}-${i}`} className="text-sm leading-relaxed text-foreground/90">
                            • {b}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted">No signals detected for this category.</p>
            )}
        </div>
    </CollapsibleSection>
);

export default function AnalysisView({ data, image, onSave, onCancel, alreadySavedToJournal = false }) {
    const [isLogged, setIsLogged] = useState(false);

    const handleSave = () => {
        if (alreadySavedToJournal) {
            onSave({ skipLocal: true });
            return;
        }
        onSave({ ...data, image, date: new Date().toISOString(), id: Date.now() });
        setIsLogged(true);
    };

    if (!data) return null;
    const hasConciseSummary = !!data.quick_summary;
    const quick = data.quick_summary || {};
    const timeline = data.timeline_impact || {};

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Section E — Pattern Flags Banner */}
            {data.meal_pattern_flags && data.meal_pattern_flags.length > 0 && (
                <div className="p-6 bg-foreground/5 border border-foreground/20 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-mono text-xs uppercase tracking-[0.2em]">
                        <AlertCircle size={16} />
                        <span>Heads up — we noticed a pattern</span>
                    </div>
                    <ul className="space-y-2 pl-6">
                        {data.meal_pattern_flags.map((flag, idx) => (
                            <li key={idx} className="list-disc text-sm font-sans italic text-foreground tracking-wide">{flag}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Top Banner for Low Confidence */}
            {data.confidence < 60 && (
                <div className="p-4 bg-foreground/5 border border-foreground/20 rounded-xl text-foreground text-sm font-sans italic flex items-center gap-3">
                    <Info size={16} className="shrink-0" />
                    I'm not fully confident about what's in this photo — these insights are estimates. Try a clearer photo or closer angle for more accurate analysis.
                </div>
            )}

            {/* Top Header */}
            <div className="flex flex-col md:flex-row items-center gap-12 pt-4">
                <div className="relative w-64 h-64 shrink-0 overflow-hidden rounded-3xl border border-foreground/10 rotate-2 group cursor-zoom-in">
                    <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Analyzed Meal" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-widest opacity-80">Nouris Analyst ID: #{data.id || 'N-001'}</div>
                </div>

                <div className="space-y-6 flex-1 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            {data.confidence >= 80 && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] border border-foreground/20 text-foreground flex items-center gap-1.5">
                                    <CheckCircle2 size={12} /> High Confidence Analysis
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl text-balance leading-[1.1]">{data.meal_name}</h1>
                    </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                    <ScoreDial score={data.health_score} />
                </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MacroCard label="Calories" value={data.nutrition.calories || 0} unit="kcal" color="bg-white" />
                <MacroCard label="Protein" value={data.nutrition.protein_g || 0} unit="g" color="bg-white" />
                <MacroCard label="Carbs" value={data.nutrition.carbs_g || 0} unit="g" color="bg-white" />
                <MacroCard label="Fat" value={data.nutrition.fat_g || 0} unit="g" color="bg-white" />
            </div>

            {/* Secondary Macro Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 border-b border-foreground/5">
                {[
                    { l: "Fiber", v: data.nutrition.fiber_g, u: "g" },
                    { l: "Sugar", v: data.nutrition.sugar_g, u: "g" },
                    { l: "Sodium", v: data.nutrition.sodium_mg, u: "mg" },
                    { l: "Omega-3", v: data.nutrition.omega3_mg, u: "mg" }
                ].map(item => (
                    <div key={item.l} className="flex flex-col">
                        <span className="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">{item.l}</span>
                        <span className="text-lg font-mono">{item.v || 0}<span className="text-[10px] text-muted ml-0.5 uppercase tracking-tighter">{item.u}</span></span>
                    </div>
                ))}
            </div>

            {hasConciseSummary && (
                <div className="space-y-6">
                    <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-foreground border-b border-foreground/10 pb-2">
                        Quick Health Summary
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <BulletCard title="Heart Health" icon="❤️" bullets={quick.cardiovascular || []} />
                        <BulletCard title="Metabolism" icon="🔥" bullets={quick.metabolic || []} />
                        <BulletCard title="Inflammation" icon="🧬" bullets={quick.inflammatory || []} />
                        <BulletCard title="Positives" icon="✅" bullets={quick.positives || []} />
                    </div>

                    <CollapsibleSection title="🧬 Long-term Timeline" defaultExpanded={false}>
                        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-4">
                            {[
                                { k: '1 week', v: timeline.oneWeek },
                                { k: '1 month', v: timeline.oneMonth },
                                { k: '1 year', v: timeline.oneYear },
                            ].map((item) => (
                                <div key={item.k} className="flex gap-4 border-b border-foreground/5 pb-3 last:border-0 last:pb-0">
                                    <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted">
                                        {item.k}
                                    </span>
                                    <p className="text-sm text-foreground/90">{item.v || 'No estimate available.'}</p>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="✅ Improvements" defaultExpanded={true}>
                        <div className="rounded-2xl border border-foreground/10 bg-card p-5 space-y-3">
                            {(data.improvements || []).length ? (
                                <ul className="space-y-2">
                                    {data.improvements.map((swap, idx) => (
                                        <li key={`imp-${idx}`} className="text-sm text-foreground/90">
                                            • {swap}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted">No improvement suggestions returned.</p>
                            )}
                        </div>
                    </CollapsibleSection>
                </div>
            )}

            {!hasConciseSummary && (
                <>
            {/* Section A — What's In This Meal */}
            <div className="space-y-6">
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-foreground border-b border-foreground/10 pb-2">What's In This Meal</h3>
                {(data.preparation_context === 'restaurant' || data.preparation_context === 'packaged') && (
                    <div className="p-4 bg-foreground/5 text-foreground border border-foreground/10 rounded-xl text-xs font-sans italic text-center md:text-left">
                        This appears to be {data.preparation_context}-prepared. Hidden sodium, seed oils, and additives are likely higher than home-cooked equivalents.
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visible Ingredients */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted">Visible Ingredients</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.visible_ingredients?.map(f => (
                                <span key={f} className="text-xs font-mono text-foreground uppercase tracking-widest bg-foreground/5 px-3 py-1.5 rounded-full border border-foreground/5">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* Likely Hidden */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted">Likely Hidden</h4>
                        <div className="space-y-3">
                            {(Array.isArray(data.likely_hidden_ingredients) ? data.likely_hidden_ingredients : []).map((hi, i) => {
                                const rel = String(hi?.health_relevance || '');
                                let relevanceColor = "text-foreground";
                                if (rel.toLowerCase().includes("concern") || rel.toLowerCase().includes("spike") || rel.toLowerCase().includes("stress")) relevanceColor = "text-foreground font-medium";
                                if (rel.toLowerCase().includes("high risk") || rel.toLowerCase().includes("damage")) relevanceColor = "text-foreground font-bold";
                                return (
                                    <div key={i} className="p-3 bg-card border border-foreground/5 rounded-xl flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold font-sans text-sm">{hi?.ingredient}</span>
                                            <span className="font-mono text-[8px] uppercase tracking-widest text-muted bg-foreground/5 px-1.5 py-0.5 rounded">{hi?.confidence}</span>
                                        </div>
                                        <p className="text-[10px] text-muted font-sans leading-tight">{hi?.reason_likely_present}</p>
                                        <p className={`text-[10px] ${relevanceColor} font-mono tracking-wide leading-tight mt-1`}>Why it matters: {hi?.health_relevance}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section B — What Happens In Your Body */}
            <div className="p-8 bg-card border border-foreground/10 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-[0.03] text-foreground">
                    <Activity size={240} strokeWidth={1} />
                </div>
                <h3 className="font-mono text-sm uppercase tracking-[0.3em] text-foreground relative z-10">The Next 4 Hours</h3>
                <p className="text-lg font-sans italic leading-relaxed text-foreground/90 relative z-10">
                    {data.what_your_body_does_next_4_hours}
                </p>
                <div className="h-px bg-foreground/10 w-full my-6 relative z-10" />
                <div className="space-y-2 relative z-10">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">If you eat this regularly:</span>
                    <p className="text-sm font-sans text-muted/80 leading-relaxed pr-8">
                        {data.chronic_risk_if_eaten_regularly}
                    </p>
                </div>
            </div>

            {/* Section C — Health Implications */}
            {data.health_implications && data.health_implications.length > 0 && (
                <CollapsibleSection title="Biological Impact">
                    <div className="grid grid-cols-1 gap-4">
                        {data.health_implications.map((imp, i) => {
                            let severityColor = "border-foreground/10";
                            if (imp.severity === "moderate") severityColor = "border-foreground/40";
                            if (imp.severity === "high") severityColor = "border-foreground";

                            return (
                                <div key={i} className={`p-5 bg-card border border-foreground/5 rounded-xl border-l-4 ${severityColor} space-y-3`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <h4 className="text-base font-bold font-sans">{imp.finding}</h4>
                                        <span className="self-start md:self-auto font-mono text-[8px] uppercase tracking-[0.2em] bg-foreground/10 text-foreground/80 px-2 py-1 rounded">
                                            {imp.timeframe.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-sans italic text-muted/90 leading-relaxed md:pr-12">
                                        {imp.biological_mechanism}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {imp.affects?.map(a => <AffectsTag key={a} affect={a} />)}
                                    </div>
                                    {imp.context && (
                                        <div className="mt-2 pt-3 border-t border-foreground/5 text-xs text-muted font-sans">
                                            <strong className="font-mono uppercase text-[8px] tracking-widest mr-2">Context</strong>
                                            {imp.context}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {/* Section D — Contaminants & Additives */}
            {data.contaminant_flags && data.contaminant_flags.length > 0 && (
                <CollapsibleSection title="Contaminants & Additives" defaultExpanded={false}>
                    <div className="grid grid-cols-1 gap-4">
                        {data.contaminant_flags.map((flag, i) => {
                            let riskPill = "bg-foreground/10 text-muted";
                            if (flag.risk_level === "moderate") riskPill = "bg-foreground/20 text-foreground";
                            if (flag.risk_level === "flag") riskPill = "bg-foreground text-background";

                            return (
                                <div key={i} className="p-6 bg-card border border-foreground/10 rounded-xl space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="text-lg font-bold font-sans">{flag.substance}</h4>
                                            <p className="text-xs text-muted font-mono tracking-widest uppercase mt-1">Found in: {flag.found_in}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded font-mono text-[8px] uppercase tracking-widest ${riskPill}`}>
                                            {flag.risk_level}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm font-sans leading-relaxed text-foreground/90">{flag.biological_mechanism}</p>
                                        <p className="text-xs italic text-muted/80">{flag.dose_context}</p>
                                        {flag.population_warnings && flag.population_warnings.length > 0 && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="font-mono text-[8px] uppercase tracking-widest text-muted">Caution for:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {flag.population_warnings.map(pw => (
                                                        <span key={pw} className="text-[9px] bg-foreground/10 text-foreground px-1.5 py-0.5 rounded font-sans">{pw}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 p-3 bg-foreground/5 border border-foreground/10 rounded-lg text-sm font-sans flex items-start gap-3">
                                        <span className="font-mono text-xs text-foreground uppercase tracking-widest shrink-0 mt-0.5">Action:</span>
                                        <span className="text-foreground/80">{flag.action}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>
            )}

            {/* Section F — Long Term Signals */}
            {data.long_term_health_signals && (
                <CollapsibleSection title="Long-Term Impact" defaultExpanded={false}>
                    <div className="space-y-0 text-sm">
                        {[
                            { k: 'Heart', v: data.long_term_health_signals.heart_health_impact },
                            { k: 'Metabolic', v: data.long_term_health_signals.metabolic_impact },
                            { k: 'Gut', v: data.long_term_health_signals.gut_health_impact },
                            { k: 'Brain', v: data.long_term_health_signals.brain_health_impact },
                            { k: 'Hormonal', v: data.long_term_health_signals.hormonal_impact },
                        ].filter(i => i.v && i.v.trim().length > 0).map((item, idx) => (
                            <div key={item.k} className="flex flex-col md:flex-row py-4 border-b border-foreground/5 last:border-0 gap-2 md:gap-8">
                                <div className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted pt-1">
                                    {item.k}
                                </div>
                                <div className="flex-1 font-sans italic text-foreground/90 leading-relaxed">
                                    {item.v}
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Section G — The One Swap */}
            {data.the_one_swap && (
                <div className="p-6 bg-white text-black rounded-2xl border border-white/20 shadow-lg mt-8">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60 mb-3">The One Change That Matters Most</h3>
                    <p className="text-base font-sans font-medium leading-snug">{data.the_one_swap}</p>
                </div>
            )}

            {/* Coach Message (Existing logic adapted) */}
            {data.coach_message && (
                <div className="p-8 bg-card-muted/50 rounded-3xl border border-foreground/10 relative mt-8">
                    <div className="absolute -top-3 left-8 bg-foreground text-background px-4 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em]">
                        Coach Insight
                    </div>
                    <p className="text-xl font-sans text-balance leading-snug pt-2 text-foreground/90">
                        {data.coach_message}
                    </p>
                </div>
            )}
                </>
            )}

            {/* Confidence Caveat Footnote */}
            {data.confidence_caveat && data.confidence_caveat.trim().length > 0 && (
                <p className="text-xs font-sans italic text-muted text-center pt-8">
                    Note: {data.confidence_caveat}
                </p>
            )}

            {/* Final Actions */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-12 pb-24 border-t border-foreground/5 mt-12">
                <button
                    onClick={onCancel}
                    className="btn-secondary"
                >
                    Discard Analysis
                </button>
                <div className="flex gap-4">
                    <button className="btn-secondary flex items-center gap-2 h-12 !px-4"><Share2 size={18} /></button>
                    {alreadySavedToJournal ? (
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-3 px-12 group"
                        >
                            Continue <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    ) : !isLogged ? (
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-3 px-12 group"
                        >
                            Log this meal <Save size={18} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    ) : (
                        <div className="bg-foreground text-background px-12 h-12 flex items-center gap-2 rounded-lg font-mono text-sm uppercase tracking-widest font-bold">
                            Success <CheckCircle2 size={18} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
