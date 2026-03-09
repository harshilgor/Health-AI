import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function Onboarding({ onComplete }) {
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState({
        api_key: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        goal: 'Eater healthier generally',
        conditions: 'None',
        age: 30,
        sex: 'male',
        activity: 'Lightly active'
    });

    const next = () => setStep(s => s + 1);
    const back = () => setStep(s => s - 1);

    const calculateTargets = (profile) => {
        // Basic BMR calculation (approximate Mifflin-St Jeor)
        const weight = profile.sex === 'male' ? 80 : 65; // placeholder weight
        const height = profile.sex === 'male' ? 175 : 160; // placeholder height
        let bmr = (10 * weight) + (6.25 * height) - (5 * profile.age) + (profile.sex === 'male' ? 5 : -161);

        // Activity factor
        const factors = {
            'Sedentary': 1.2,
            'Lightly active': 1.375,
            'Moderately active': 1.55,
            'Very active': 1.725
        };
        let calories = bmr * (factors[profile.activity] || 1.375);

        // Goal adjustment
        if (profile.goal === 'Lose weight') calories -= 500;
        if (profile.goal === 'Build muscle') calories += 300;

        return {
            daily_calories: Math.round(calories),
            protein_target: Math.round(calories * 0.25 / 4), // 25% protein
            fat_target: Math.round(calories * 0.3 / 9),   // 30% fat
            carb_target: Math.round(calories * 0.45 / 4), // 45% carbs
            fiber_target: 30, // standard
        };
    };

    const finish = () => {
        const apiKey = profile.api_key || import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) return alert("Please enter an API Key or add VITE_ANTHROPIC_API_KEY to your .env file");
        const targets = calculateTargets(profile);
        const fullProfile = { ...profile, api_key: apiKey, ...targets, joined: new Date().toISOString() };
        localStorage.setItem('nouris_profile', JSON.stringify(fullProfile));
        onComplete(fullProfile);
    };

    const steps = [
        {
            title: "Welcome to Nouris",
            content: (
                <div className="space-y-6">
                    <p className="text-muted text-lg">Your personal nutrition scientist is ready to analyze. Let's start with your Anthropic API Key.</p>
                    <div className="space-y-2">
                        <label className="font-mono text-xs uppercase tracking-widest text-accent">Anthropic API Key</label>
                        <input
                            type="password"
                            placeholder="sk-ant-..."
                            className="w-full bg-card border border-foreground/10 p-4 rounded-xl focus:outline-none focus:border-accent font-mono"
                            value={profile.api_key}
                            onChange={(e) => setProfile({ ...profile, api_key: e.target.value })}
                        />
                        <p className="text-[10px] text-muted leading-relaxed">Your key is stored locally on this device and never leaves your browser except to call Anthropic's API.</p>
                    </div>
                </div>
            )
        },
        {
            title: "Primary Health Goal",
            content: (
                <div className="grid grid-cols-1 gap-3">
                    {["Lose weight", "Build muscle", "Improve energy", "Manage blood sugar", "Eat healthier generally"].map(g => (
                        <button key={g}
                            className={`p-4 rounded-xl border transition-all text-left ${profile.goal === g ? 'border-accent bg-accent/10' : 'border-foreground/10 hover:border-foreground/20'}`}
                            onClick={() => { setProfile({ ...profile, goal: g }); next(); }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            )
        },
        {
            title: "Health Conditions",
            content: (
                <div className="grid grid-cols-1 gap-3">
                    {["Diabetes", "Hypertension", "High cholesterol", "None"].map(c => (
                        <button key={c}
                            className={`p-4 rounded-xl border transition-all text-left ${profile.conditions === c ? 'border-accent bg-accent/10' : 'border-foreground/10 hover:border-foreground/20'}`}
                            onClick={() => { setProfile({ ...profile, conditions: c }); next(); }}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            )
        },
        {
            title: "Profile Details",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="font-mono text-xs uppercase text-muted">Age</label>
                            <input type="number"
                                className="w-full bg-card border border-foreground/10 p-4 rounded-xl focus:border-accent"
                                value={profile.age}
                                onChange={e => setProfile({ ...profile, age: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-mono text-xs uppercase text-muted">Sex</label>
                            <select
                                className="w-full bg-card border border-foreground/10 p-4 rounded-xl focus:border-accent appearance-none"
                                value={profile.sex}
                                onChange={e => setProfile({ ...profile, sex: e.target.value })}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-mono text-xs uppercase text-muted">Activity Level</label>
                        <div className="grid grid-cols-2 gap-3">
                            {["Sedentary", "Lightly active", "Moderately active", "Very active"].map(a => (
                                <button key={a}
                                    className={`p-3 text-sm rounded-xl border transition-all ${profile.activity === a ? 'border-accent bg-accent/10' : 'border-foreground/10 hover:border-foreground/20'}`}
                                    onClick={() => setProfile({ ...profile, activity: a })}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full">
                <div className="mb-12">
                    <h1 className="text-accent font-mono text-sm uppercase tracking-[0.3em] mb-2">Nouris</h1>
                    <h2 className="text-4xl">
                        {steps[step].title}
                    </h2>
                </div>

                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="min-h-[300px]"
                >
                    {steps[step].content}
                </motion.div>

                <div className="mt-12 flex items-center justify-between">
                    {step > 0 ? (
                        <button onClick={back} className="text-muted hover:text-foreground transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
                            <ArrowLeft size={16} /> Back
                        </button>
                    ) : <div />}

                    <button
                        onClick={step === steps.length - 1 ? finish : next}
                        className="btn-primary flex items-center gap-2"
                    >
                        {step === steps.length - 1 ? "Complete" : "Continue"} <ChevronRight size={18} />
                    </button>
                </div>

                <div className="mt-12 flex gap-2">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-accent' : 'bg-foreground/10'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}
