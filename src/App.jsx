import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Onboarding from './views/Onboarding';
import Dashboard from './views/Dashboard';
import AnalysisView from './views/AnalysisView';
import WeeklyReport from './views/WeeklyReport';
import SymptomLog from './views/SymptomLog';
import { analyzeMealWithGemini } from './lib/geminiClient';
import { createMeal, listMeals, apiMealToLocal } from './lib/mealsApi';
import { getOrCreateUserId } from './lib/userId';
import { supabase } from './lib/supabaseClient';
import { getProfile, saveProfile } from './lib/profileApi';
import { listSymptoms, createSymptom } from './lib/symptomsApi';
import AuthLanding from './views/AuthLanding';
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
    const [anonUserId] = useState(() => getOrCreateUserId());
    const [remoteMeals, setRemoteMeals] = useState([]);
    const [mealsApiConfigured, setMealsApiConfigured] = useState(false);
    const [session, setSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('analyze');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisImage, setAnalysisImage] = useState(null);
    const [analysisMeta, setAnalysisMeta] = useState(null);
    const [lastAnalyzeOpts, setLastAnalyzeOpts] = useState({ mealType: 'lunch', location: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const originalImageRef = useRef(null);

    const displayMeals = useMemo(() => {
        if (!mealsApiConfigured) return meals;
        const byId = new Map(remoteMeals.map((m) => [String(m.id), m]));
        for (const m of meals) {
            const id = String(m.id);
            if (!m.fromApi && !byId.has(id)) byId.set(id, m);
        }
        return Array.from(byId.values()).sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );
    }, [mealsApiConfigured, remoteMeals, meals]);

    useEffect(() => {
        if (!supabase) {
            // Supabase isn't configured for this environment; keep anonymous/local mode.
            setAuthLoading(false);
            return;
        }

        let isCancelled = false;

        supabase.auth.getSession().then(({ data }) => {
            if (isCancelled) return;
            setSession(data?.session || null);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession || null);
        });

        return () => {
            isCancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (authLoading) return;
        let cancelled = false;

        // Clear local state when switching to an authed user.
        if (session) {
            setMeals([]);
            setSymptoms([]);
        }

        listMeals({ accessToken: session?.access_token, userId: anonUserId })
            .then(({ meals: rows, configured }) => {
                if (cancelled) return;
                setMealsApiConfigured(!!configured);
                setRemoteMeals((rows || []).map(apiMealToLocal));
            })
            .catch(() => {
                if (cancelled) return;
                setRemoteMeals([]);
                setMealsApiConfigured(false);
            });

        return () => {
            cancelled = true;
        };
    }, [authLoading, session, anonUserId, setMeals, setSymptoms]);

    const handleAnalyze = async (base64, mediaType = 'image/jpeg', opts = {}) => {
        const mealType = opts.mealType ?? 'lunch';
        const location = opts.location ?? '';
        setLastAnalyzeOpts({ mealType, location });
        originalImageRef.current = base64;
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);
        setAnalysisMeta(null);
        setAnalysisImage(base64);
        try {
            try {
                const created = await createMeal({
                    accessToken: session?.access_token,
                    userId: anonUserId,
                    base64Image: base64,
                    mediaType,
                    mealType,
                    location,
                });
                const localRow = apiMealToLocal(created);
                setRemoteMeals((prev) => [
                    localRow,
                    ...prev.filter((x) => x.meal_id !== localRow.meal_id),
                ]);
                setMealsApiConfigured(true);
                setAnalysisResult(created.analysis);
                setAnalysisImage(created.image_url || base64);
                setAnalysisMeta({ fromApi: true, mealId: created.meal_id });
            } catch (e) {
                if (
                    e.code === 'STORAGE_NOT_CONFIGURED' ||
                    e.status === 503 ||
                    e.status === 401 ||
                    e.status === 403
                ) {
                    const result = await analyzeMealWithGemini(base64, mediaType);
                    setAnalysisResult(result);
                    setAnalysisImage(base64);
                    setAnalysisMeta(null);
                } else {
                    throw e;
                }
            }
        } catch (err) {
            console.error(err);
            setError(
                err?.message ||
                    'Something went wrong with this analysis. This sometimes happens with unclear photos or unusual dishes. Try again with a clearer image.'
            );
            setAnalysisResult(null);
            setAnalysisImage(null);
            setAnalysisMeta(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveMeal = (mealData) => {
        if (mealData.skipLocal) {
            setAnalysisResult(null);
            setAnalysisImage(null);
            setAnalysisMeta(null);
            setActiveTab('analyze');
            return;
        }
        setMeals([mealData, ...meals]);
        setAnalysisResult(null);
        setAnalysisImage(null);
        setAnalysisMeta(null);
        setActiveTab('analyze');
    };

    const saveSymptom = (symptomData) => {
        if (!session) {
            setSymptoms([symptomData, ...symptoms]);
            return;
        }

        const token = session?.access_token;
        if (!token) return;

        createSymptom(token, symptomData)
            .then((log) => {
                if (!log) return;
                setSymptoms((prev) => [log, ...prev]);
            })
            .catch((e) => console.error('Failed to save symptom:', e));
    };

    const envApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_API_KEY;

    useEffect(() => {
        if (session) return;
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
    }, [session, profile, envApiKey]);

    useEffect(() => {
        if (!session) return;

        const token = session?.access_token;
        if (!token) return;

        const localApiKey = profile?.api_key || envApiKey;

        setUserDataLoading(true);

        // Clear local cache while we load the authed user's persisted data.
        setMeals([]);
        setSymptoms([]);
        setProfile(null);

        const load = async () => {
            try {
                const [savedProfile, savedSymptoms] = await Promise.all([
                    getProfile(token),
                    listSymptoms(token),
                ]);

                if (savedProfile) {
                    setProfile({
                        ...savedProfile,
                        api_key: localApiKey,
                    });
                }

                if (Array.isArray(savedSymptoms)) {
                    setSymptoms(
                        savedSymptoms.map((s) => ({
                            ...s,
                            // Preserve the UI's expected shape.
                            date: s.date,
                        }))
                    );
                }
            } catch (e) {
                console.error('Failed to load authed user data:', e);
                setProfile(null);
                setSymptoms([]);
            } finally {
                setUserDataLoading(false);
            }
        };

        load();
    }, [session, envApiKey]);

    // If we loaded a profile from Supabase but don't have an API key locally,
    // fill it from env (so WeeklyReport/Symptom correlation can work).
    useEffect(() => {
        if (!session) return;
        if (!profile) return;
        if (profile.api_key) return;
        if (!envApiKey) return;
        setProfile({ ...profile, api_key: envApiKey });
    }, [session, profile, envApiKey]);

    if (authLoading) {
        return <PulseBackground />;
    }

    if (supabase && !session) {
        return (
            <>
                <PulseBackground />
                <AuthLanding supabase={supabase} />
            </>
        );
    }

    if (session && userDataLoading) {
        return <PulseBackground />;
    }

    if (!profile) {
        if (!session && envApiKey) return <PulseBackground />;
        return (
            <>
                <PulseBackground />
                <Onboarding
                    onComplete={async (p) => {
                        setProfile(p);
                        if (session) {
                            const token = session?.access_token;
                            try {
                                await saveProfile(token, p);
                            } catch (e) {
                                console.error('Failed to save profile:', e);
                            }
                        }
                    }}
                />
            </>
        );
    }

    if (!profile.api_key && !envApiKey) {
        return (
            <>
                <PulseBackground />
                <Onboarding
                    onComplete={async (p) => {
                        setProfile(p);
                        if (session) {
                            const token = session?.access_token;
                            try {
                                await saveProfile(token, p);
                            } catch (e) {
                                console.error('Failed to save profile:', e);
                            }
                        }
                    }}
                />
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
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleAnalyze(
                                                originalImageRef.current || analysisImage,
                                                'image/jpeg',
                                                lastAnalyzeOpts
                                            )
                                        }
                                        className="btn-primary"
                                    >
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
                            alreadySavedToJournal={!!analysisMeta?.fromApi}
                            onSave={saveMeal}
                            onCancel={() => {
                                setAnalysisResult(null);
                                setAnalysisImage(null);
                                setAnalysisMeta(null);
                            }}
                        />
                    ) : (
                        <>
                            {activeTab === 'analyze' && (
                                <Dashboard profile={profile} meals={displayMeals} onAnalyze={handleAnalyze} />
                            )}
                            {activeTab === 'today' && (
                                <Dashboard profile={profile} meals={displayMeals} onAnalyze={handleAnalyze} />
                            )}
                            {activeTab === 'week' && <WeeklyReport profile={profile} meals={displayMeals} />}
                            {activeTab === 'symptoms' && (
                                <SymptomLog profile={profile} logs={symptoms} meals={displayMeals} onLog={saveSymptom} />
                            )}
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
