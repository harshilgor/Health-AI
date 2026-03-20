import React, { useMemo, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

const ProgressRing = ({ value, max, label, color = "#FFFFFF", size = 120, thickness = 8 }) => {
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(1, Math.max(0, value / max));
    const offset = circumference - (percentage * circumference);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={thickness}
                        fill="transparent"
                        className="text-foreground/5"
                    />
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={thickness}
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl font-sans leading-none"
                    >
                        {value.toLocaleString()}
                    </motion.span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted mt-1">{label.split(' ')[0]}</span>
                </div>
            </div>
        </div>
    );
};

const MEAL_TYPES = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
];

export default function Dashboard({ profile, meals = [], onAnalyze }) {
    const [mealType, setMealType] = useState('lunch');
    const [location, setLocation] = useState('');
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = useMemo(
        () => meals.filter((m) => (m.date || '').startsWith(today)),
        [meals, today]
    );

    const totals = useMemo(() => todaysMeals.reduce((acc, m) => ({
        calories: acc.calories + m.nutrition.calories,
        protein: acc.protein + m.nutrition.protein_g,
        fiber: acc.fiber + m.nutrition.fiber_g,
    }), { calories: 0, protein: 0, fiber: 0 }), [todaysMeals]);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            onAnalyze(reader.result, file.type, { mealType, location: location.trim() });
        };
        reader.readAsDataURL(file);
    }, [onAnalyze, mealType, location]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const recentHistory = meals.slice(0, 3);

    return (
        <div className="space-y-12">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Today</h1>
                <p className="text-muted text-sm">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-muted">Meal type</label>
                    <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full rounded-xl border border-foreground/10 bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                        {MEAL_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-muted">Location (optional)</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Home, café, office…"
                        className="w-full rounded-xl border border-foreground/10 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                </div>
            </div>

            <div
                {...getRootProps()}
                className={`rounded-2xl border-2 border-dashed py-16 md:py-20 flex flex-col items-center gap-5 transition-all duration-300 cursor-pointer ${isDragActive ? 'border-foreground/30 bg-foreground/[0.02]' : 'border-foreground/10 hover:border-foreground/20 bg-card'}`}
            >
                <div className="w-14 h-14 rounded-full bg-foreground/[0.06] flex items-center justify-center text-foreground">
                    <Camera size={26} strokeWidth={1.5} />
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-medium text-foreground">Add a meal photo</h2>
                    <p className="text-muted text-sm">Drop an image or tap to upload</p>
                </div>
                <input {...getInputProps()} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 md:p-10 bg-card rounded-2xl shadow-sm">
                <ProgressRing
                    value={totals.calories}
                    max={profile.daily_calories || 2500}
                    label="Calories"
                    color="#FFFFFF"
                />
                <ProgressRing
                    value={totals.protein}
                    max={profile.protein_target || 150}
                    label="Protein (g)"
                    color="#AAAAAA"
                />
                <ProgressRing
                    value={totals.fiber}
                    max={profile.fiber_target || 30}
                    label="Fiber (g)"
                    color="#666666"
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted">Recent meals</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentHistory.length > 0 ? recentHistory.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card rounded-xl overflow-hidden shadow-sm"
                        >
                            <div className="h-32 bg-card-muted relative">
                                {m.image && <img src={m.image} className="w-full h-full object-cover" alt="" />}
                                <div className="absolute top-3 right-3 bg-background/90 px-2 py-0.5 rounded-md text-xs font-medium">
                                    {m.health_score}/10
                                </div>
                            </div>
                            <div className="p-3 space-y-0.5">
                                <h4 className="text-sm font-medium truncate">{m.meal_name}</h4>
                                <div className="flex justify-between text-xs text-muted">
                                    <span>{m.nutrition?.calories ?? 0} kcal</span>
                                    <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-3 py-10 text-center text-muted text-sm">
                            No meals yet. Add a photo above to start.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
