import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Onboarding from './views/Onboarding';
import Dashboard from './views/Dashboard';
import AnalysisView from './views/AnalysisView';
import WeeklyReport from './views/WeeklyReport';
import SymptomLog from './views/SymptomLog';
import { analyzeMealWithLogMeal } from './lib/logmeal';
import { Camera, LayoutDashboard, Calendar, Activity, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PulseBackground = () => (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-foreground/[0.02] rounded-full blur-[100px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-foreground/[0.02] rounded-full blur-[80px]" />
    </div>
);

const NavItem = ({ id, active, label, icon: Icon, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${active ? 'bg-foreground/[0.06] text-foreground' : 'text-muted hover:text-foreground hover:bg-foreground/[0.03]'}`}
    >
        <Icon size={18} strokeWidth={1.5} />
        <span>{label}</span>
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
        setAnalysisResult(null);
        setAnalysisImage(base64);
        try {
            const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
            const result = await analyzeMealWithLogMeal(cleanBase64, mediaType);
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            setError("Something went wrong with this analysis. This sometimes happens with unclear photos or unusual dishes. Try again with a clearer image.");
            setAnalysisResult(null);
            setAnalysisImage(null);
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
                <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-foreground/[0.06] p-6 space-y-10">
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-semibold tracking-tight">Nouris</h1>
                        <p className="text-xs text-muted">Nutrition</p>
                    </div>
                    <nav className="flex flex-col gap-0.5">
                        <NavItem id="analyze" active={activeTab === 'analyze'} label="Analyze" icon={Camera} onClick={setActiveTab} />
                        <NavItem id="today" active={activeTab === 'today'} label="Today" icon={LayoutDashboard} onClick={setActiveTab} />
                        <NavItem id="week" active={activeTab === 'week'} label="Week" icon={Calendar} onClick={setActiveTab} />
                        <NavItem id="symptoms" active={activeTab === 'symptoms'} label="Symptoms" icon={Activity} onClick={setActiveTab} />
                    </nav>
                    <div className="mt-auto pt-6 border-t border-foreground/[0.06]">
                        <p className="text-xs text-muted truncate">{profile.goal}</p>
                        <p className="text-xs text-foreground/70 mt-0.5">{profile.age}y · {profile.sex}</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-5 md:p-10 md:max-h-screen overflow-y-auto custom-scrollbar pb-20 md:pb-0">
                    {error && !isAnalyzing && (
                        <div className="mb-8 p-6 md:p-8 bg-card rounded-2xl shadow-sm flex flex-col items-center text-center gap-5 max-w-md mx-auto mt-8">
                            <div className="w-12 h-12 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                                <X size={20} className="text-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold">Analysis failed</h3>
                                <p className="text-sm text-muted text-left max-w-sm">{error}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setError(null); setAnalysisImage(null); }} className="btn-secondary">Dismiss</button>
                                {analysisImage && (
                                    <button onClick={() => handleAnalyze(analysisImage)} className="btn-primary">
                                        Retry
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

                {/* Mobile Nav - minimal pill bar */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-foreground/[0.06] flex items-center justify-around px-4 z-40 safe-area-pb">
                    <button onClick={() => setActiveTab('analyze')} className={`flex flex-col items-center gap-0.5 py-2 ${activeTab === 'analyze' ? 'text-foreground' : 'text-muted'}`}>
                        <Camera size={22} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium">Analyze</span>
                    </button>
                    <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center gap-0.5 py-2 ${activeTab === 'today' ? 'text-foreground' : 'text-muted'}`}>
                        <LayoutDashboard size={22} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium">Today</span>
                    </button>
                    <button onClick={() => setActiveTab('week')} className={`flex flex-col items-center gap-0.5 py-2 ${activeTab === 'week' ? 'text-foreground' : 'text-muted'}`}>
                        <Calendar size={22} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium">Week</span>
                    </button>
                    <button onClick={() => setActiveTab('symptoms')} className={`flex flex-col items-center gap-0.5 py-2 ${activeTab === 'symptoms' ? 'text-foreground' : 'text-muted'}`}>
                        <Activity size={22} strokeWidth={1.5} />
                        <span className="text-[10px] font-medium">Symptoms</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}
