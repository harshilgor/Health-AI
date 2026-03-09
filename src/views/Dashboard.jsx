import React, { useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, Plus, ArrowRight } from 'lucide-react';

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

export default function Dashboard({ profile, meals = [], onAnalyze }) {
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = useMemo(() => meals.filter(m => m.date.startsWith(today)), [meals, today]);

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
            onAnalyze(reader.result, file.type);
        };
        reader.readAsDataURL(file);
    }, [onAnalyze]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const recentHistory = meals.slice(0, 3);

    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <h1 className="text-5xl">Dashboard</h1>
                <p className="text-muted text-xl font-sans italic">Your nutritional state for today, {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}.</p>
            </div>

            <div
                {...getRootProps()}
                className={`card group cursor-pointer border-dashed border-2 py-20 flex flex-col items-center gap-6 transition-all duration-500 overflow-hidden relative ${isDragActive ? 'border-accent bg-accent/5' : 'border-foreground/10 hover:border-foreground/30'}`}
            >
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Camera size={32} />
                </div>
                <div className="relative z-10 text-center space-y-2">
                    <h2 className="text-2xl">Drop a photo of your meal</h2>
                    <p className="text-muted font-mono text-xs uppercase tracking-widest">or click to browse files</p>
                </div>
                <input {...getInputProps()} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-card/50 rounded-[40px] border border-foreground/5 backdrop-blur-sm">
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

            <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-foreground/5">
                    <h3 className="text-xl font-mono uppercase tracking-widest">Recent Analysis</h3>
                    <button className="text-accent text-sm font-mono uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                        History <ArrowRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recentHistory.length > 0 ? recentHistory.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="card !p-0 overflow-hidden group hover:border-accent/40"
                        >
                            <div className="h-40 bg-muted/20 relative">
                                {m.image && <img src={m.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={m.name} />}
                                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono border border-foreground/5">
                                    {m.health_score}/10
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <h4 className="text-lg leading-tight truncate">{m.meal_name}</h4>
                                <div className="flex items-center justify-between text-[10px] font-mono text-muted uppercase tracking-widest">
                                    <span>{m.nutrition.calories} kcal</span>
                                    <span>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-3 py-12 text-center text-muted font-sans italic text-lg">
                            No meals analyzed yet. Capture your first meal to start tracking.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
