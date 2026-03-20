import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function Onboarding({ onComplete }) {
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState({
        api_key: import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_API_KEY || '',
        goal: 'Eater healthier generally',
        conditions: 'None',
        age: 30,
        sex: 'male',
        activity: 'Lightly active',
    });

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => s - 1);

    const calculateTargets = (p) => {
        const weight = p.sex === 'male' ? 80 : 65;
        const height = p.sex === 'male' ? 175 : 160;
        let bmr =
            10 * weight + 6.25 * height - 5 * p.age + (p.sex === 'male' ? 5 : -161);

        const factors = {
            Sedentary: 1.2,
            'Lightly active': 1.375,
            'Moderately active': 1.55,
            'Very active': 1.725,
        };
        let calories = bmr * (factors[p.activity] || 1.375);

        if (p.goal === 'Lose weight') calories -= 500;
        if (p.goal === 'Build muscle') calories += 300;

        return {
            daily_calories: Math.round(calories),
            protein_target: Math.round((calories * 0.25) / 4),
            fat_target: Math.round((calories * 0.3) / 9),
            carb_target: Math.round((calories * 0.45) / 4),
            fiber_target: 30,
        };
    };

    const finish = () => {
        const apiKey =
            profile.api_key ||
            import.meta.env.VITE_ANTHROPIC_API_KEY ||
            import.meta.env.VITE_API_KEY;
        if (!apiKey)
            return alert(
                'Please enter an API Key or add VITE_ANTHROPIC_API_KEY to your .env file'
            );
        const targets = calculateTargets(profile);
        const fullProfile = {
            ...profile,
            api_key: apiKey,
            ...targets,
            joined: new Date().toISOString(),
        };
        localStorage.setItem('nouris_profile', JSON.stringify(fullProfile));
        onComplete(fullProfile);
    };

    const optionBtn = (selected) =>
        `rounded-xl border-2 p-4 text-left text-base font-medium text-neutral-900 transition-all ` +
        (selected
            ? 'border-neutral-900 bg-neutral-100 shadow-sm'
            : 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50');

    const steps = [
        {
            title: 'Welcome to Nouris',
            content: (
                <div className="space-y-6">
                    <p className="text-lg leading-relaxed text-neutral-600">
                        Your personal nutrition scientist is ready to analyze your meals. Let&apos;s
                        start with your health goals.
                    </p>
                </div>
            ),
        },
        {
            title: 'Primary Health Goal',
            content: (
                <div className="grid grid-cols-1 gap-3">
                    {[
                        'Lose weight',
                        'Build muscle',
                        'Improve energy',
                        'Manage blood sugar',
                        'Eat healthier generally',
                    ].map((g) => (
                        <button
                            key={g}
                            type="button"
                            className={optionBtn(profile.goal === g)}
                            onClick={() => {
                                setProfile({ ...profile, goal: g });
                                next();
                            }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            ),
        },
        {
            title: 'Health Conditions',
            content: (
                <div className="grid grid-cols-1 gap-3">
                    {['Diabetes', 'Hypertension', 'High cholesterol', 'None'].map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={optionBtn(profile.conditions === c)}
                            onClick={() => {
                                setProfile({ ...profile, conditions: c });
                                next();
                            }}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            ),
        },
        {
            title: 'Profile Details',
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-600">
                                Age
                            </label>
                            <input
                                type="number"
                                className="w-full rounded-xl border-2 border-neutral-300 bg-white p-4 text-neutral-900 outline-none focus:border-neutral-900"
                                value={profile.age}
                                onChange={(e) =>
                                    setProfile({ ...profile, age: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-600">
                                Sex
                            </label>
                            <select
                                className="w-full appearance-none rounded-xl border-2 border-neutral-300 bg-white p-4 text-neutral-900 outline-none focus:border-neutral-900"
                                value={profile.sex}
                                onChange={(e) =>
                                    setProfile({ ...profile, sex: e.target.value })
                                }
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-600">
                            Activity Level
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                'Sedentary',
                                'Lightly active',
                                'Moderately active',
                                'Very active',
                            ].map((a) => (
                                <button
                                    key={a}
                                    type="button"
                                    className={`p-3 text-left text-sm ${optionBtn(
                                        profile.activity === a
                                    )}`}
                                    onClick={() => setProfile({ ...profile, activity: a })}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6 text-neutral-900">
            <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-10">
                <div className="mb-10">
                    <h1 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-neutral-900">
                        Nouris
                    </h1>
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
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
                        <button
                            type="button"
                            onClick={back}
                            className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-widest text-neutral-700 transition-colors hover:text-neutral-900"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        type="button"
                        onClick={step === steps.length - 1 ? finish : next}
                        className="btn-primary flex items-center gap-2"
                    >
                        {step === steps.length - 1 ? 'Complete' : 'Continue'}{' '}
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="mt-12 flex gap-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                i <= step ? 'bg-neutral-900' : 'bg-neutral-200'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
