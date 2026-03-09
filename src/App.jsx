import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Onboarding from './views/Onboarding';
import Dashboard from './views/Dashboard';
import AnalysisView from './views/AnalysisView';
import WeeklyReport from './views/WeeklyReport';
import SymptomLog from './views/SymptomLog';
import { analyzeMeal } from './lib/claude';
import { Camera, LayoutDashboard, Calendar, Activity, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PulseBackground = () => (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
    </div>
);

const NavItem = ({ id, active, label, icon: Icon, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-mono text-xs uppercase tracking-[0.2em] relative overflow-hidden group ${active ? 'text-accent' : 'text-muted hover:text-foreground'}`}
    >
        {active && (
            <div className="absolute inset-0 bg-accent/5 transition-opacity" />
        )}
        <Icon size={18} className={active ? 'text-accent' : 'text-muted group-hover:text-foreground'} />
        <span className="relative z-10">{label}</span>
    </button>
);

const LoadingAnalysis = () => {
    const [factIndex, setFactIndex] = useState(0);
    const facts = [
        "Restaurant meals average 3x the sodium of home-cooked equivalents",
        "Seed oils are used in 90% of restaurant cooking — most menus won't tell you",
        "Your gut microbiome responds to meal composition within 6 hours",
        "Refined carbs spike blood glucose faster than table sugar in many cases",
        "Omega-3 deficiency affects an estimated 70% of people eating a Western diet",
        "Cooking method changes a food's health profile more than most people realize",
        "The glycemic response to the same food varies by up to 40% between individuals",
        "Chronic low-grade inflammation from diet typically shows no symptoms for years"
    ];

    useEffect(() => {
        const timer = setInterval(() => setFactIndex(i => (i + 1) % facts.length), 2500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-12">
                <Loader2 size={100} className="text-accent animate-spin-slow opacity-20" strokeWidth={0.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={40} className="text-accent animate-pulse" />
                </div>
            </div>
            <div className="space-y-6 max-w-md">
                <h2 className="text-3xl font-sans italic text-balance">Decoding your nutrition chemistry...</h2>
                <div className="h-24 flex items-center justify-center relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={factIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-xs font-sans uppercase tracking-[0.1em] text-muted italic absolute w-full"
                        >
                            {facts[factIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [profile, setProfile] = useLocalStorage('nouris_profile', null);
    const [meals, setMeals] = useLocalStorage('nouris_meals', []);
    const [symptoms, setSymptoms] = useLocalStorage('nouris_symptoms', []);
    const [activeTab, setActiveTab] = useState('analyze');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisImage, setAnalysisImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async (base64, mediaType = "image/jpeg") => {
        setIsAnalyzing(true);
        setError(null);
        setAnalysisImage(base64);
        try {
            // Clean base64 (remove data:image/...;base64,)
            const cleanBase64 = base64.split(',')[1];
            const apiKey = profile.api_key || import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_API_KEY;
            const result = await analyzeMeal(apiKey, cleanBase64, mediaType, profile, meals.slice(0, 3));
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            setError("Something went wrong with this analysis. This sometimes happens with unclear photos or unusual dishes. Try again with a clearer image.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveMeal = (mealData) => {
        setMeals([mealData, ...meals]);
        setAnalysisResult(null);
        setAnalysisImage(null);
        setActiveTab('analyze');
    };

    const saveSymptom = (symptomData) => {
        setSymptoms([symptomData, ...symptoms]);
    };

    const envApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_API_KEY;

    useEffect(() => {
        if (!profile && envApiKey) {
            const defaultProfile = {
                api_key: envApiKey,
                goal: 'Eat healthier generally',
                conditions: 'None',
                age: 30,
                sex: 'male',
                activity: 'Lightly active',
                daily_calories: 2000,
                protein_target: 125,
                fat_target: 67,
                carb_target: 225,
                fiber_target: 30,
                joined: new Date().toISOString()
            };
            setProfile(defaultProfile);
        }
    }, []);

    if (!profile) {
        if (envApiKey) {
            return <PulseBackground />;
        }
        return (
            <>
                <PulseBackground />
                <Onboarding onComplete={p => setProfile(p)} />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent/40 selection:text-white pb-24 md:pb-0">
            <PulseBackground />
            {isAnalyzing && <LoadingAnalysis />}

            <div className="flex flex-col md:flex-row max-w-[1400px] mx-auto">
                {/* Sidebar Nav (Desktop) */}
                <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-foreground/5 p-8 space-y-12">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-mono uppercase tracking-[0.5em] text-accent">Nouris</h1>
                        <p className="text-[8px] font-mono text-muted uppercase tracking-widest pl-1">Personal Nutrition Scientist</p>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <NavItem id="analyze" active={activeTab === 'analyze'} label="Analyze" icon={Camera} onClick={setActiveTab} />
                        <NavItem id="today" active={activeTab === 'today'} label="Today" icon={LayoutDashboard} onClick={setActiveTab} />
                        <NavItem id="week" active={activeTab === 'week'} label="Weekly Report" icon={Calendar} onClick={setActiveTab} />
                        <NavItem id="symptoms" active={activeTab === 'symptoms'} label="Symptoms" icon={Activity} onClick={setActiveTab} />
                    </nav>

                    <div className="mt-auto space-y-4">
                        <div className="p-4 bg-foreground/5 rounded-2xl border border-foreground/5 flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-mono text-accent">ID</div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{profile.goal}</p>
                                <p className="text-xs font-sans italic text-foreground/80">{profile.age}y / {profile.sex}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-12 md:max-h-screen overflow-y-auto custom-scrollbar">
                    {error && !isAnalyzing && (
                        <div className="mb-12 p-8 bg-card border border-foreground/10 rounded-2xl flex flex-col items-center text-center gap-6 max-w-lg mx-auto mt-12">
                            <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center text-foreground">
                                <X size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-sans">Analysis Failed</h3>
                                <p className="text-sm font-sans italic text-muted max-w-xs">{error}</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => { setError(null); setAnalysisImage(null); }} className="btn-secondary !px-8">Cancel</button>
                                {analysisImage && (
                                    <button onClick={() => handleAnalyze(analysisImage)} className="btn-primary flex items-center gap-2 !px-8">
                                        Retry Analysis
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {!error && analysisResult ? (
                        <AnalysisView
                            data={analysisResult}
                            image={analysisImage}
                            onSave={saveMeal}
                            onCancel={() => { setAnalysisResult(null); setAnalysisImage(null); }}
                        />
                    ) : (
                        <>
                            {activeTab === 'analyze' && <Dashboard profile={profile} meals={meals} onAnalyze={handleAnalyze} />}
                            {activeTab === 'today' && <Dashboard profile={profile} meals={meals} onAnalyze={handleAnalyze} />} {/* Shared dashboard for now */}
                            {activeTab === 'week' && <WeeklyReport profile={profile} meals={meals} />}
                            {activeTab === 'symptoms' && <SymptomLog profile={profile} logs={symptoms} meals={meals} onLog={saveSymptom} />}
                        </>
                    )}
                </main>

                {/* Mobile Nav */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-foreground/5 flex items-center justify-around px-2 z-40">
                    <button onClick={() => setActiveTab('analyze')} className={`flex flex-col items-center gap-1 ${activeTab === 'analyze' ? 'text-accent' : 'text-muted'}`}>
                        <Camera size={20} /> <span className="text-[8px] font-mono uppercase tracking-widest">Analyze</span>
                    </button>
                    <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center gap-1 ${activeTab === 'today' ? 'text-accent' : 'text-muted'}`}>
                        <LayoutDashboard size={20} /> <span className="text-[8px] font-mono uppercase tracking-widest">Today</span>
                    </button>
                    <button onClick={() => setActiveTab('week')} className={`flex flex-col items-center gap-1 ${activeTab === 'week' ? 'text-accent' : 'text-muted'}`}>
                        <Calendar size={20} /> <span className="text-[8px] font-mono uppercase tracking-widest">Week</span>
                    </button>
                    <button onClick={() => setActiveTab('symptoms')} className={`flex flex-col items-center gap-1 ${activeTab === 'symptoms' ? 'text-accent' : 'text-muted'}`}>
                        <Activity size={20} /> <span className="text-[8px] font-mono uppercase tracking-widest">Symptom</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}
