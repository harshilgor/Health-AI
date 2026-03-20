import React from 'react';

/** 0–100 → green / amber / brown palette */
function plantColors(health) {
  const h = Math.max(0, Math.min(100, health)) / 100;
  const leaf = h > 0.66 ? '#15803d' : h > 0.4 ? '#ca8a04' : '#92400e';
  const leafLight = h > 0.66 ? '#22c55e' : h > 0.4 ? '#eab308' : '#b45309';
  const trunk = h > 0.35 ? '#57534e' : '#78716c';
  return { leaf, leafLight, trunk, opacity: 0.35 + h * 0.65 };
}

function scaleForHealth(health) {
  return 0.75 + (Math.max(0, Math.min(100, health)) / 100) * 0.28;
}

/** Cardiovascular — oak-style tree */
export function HeartTreeGraphic({ health = 50, className = '' }) {
  const { leaf, leafLight, trunk, opacity } = plantColors(health);
  const s = scaleForHealth(health);
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      style={{ transform: `scale(${s})`, opacity }}
      aria-hidden
    >
      <ellipse cx="60" cy="118" rx="28" ry="6" fill="currentColor" className="text-emerald-900/10" />
      <path d="M52 120 L56 78 L64 78 L68 120 Z" fill={trunk} />
      <circle cx="60" cy="52" r="32" fill={leaf} />
      <circle cx="42" cy="62" r="18" fill={leafLight} opacity="0.9" />
      <circle cx="78" cy="58" r="20" fill={leafLight} opacity="0.85" />
      <circle cx="60" cy="38" r="14" fill={leafLight} />
      {health < 45 && (
        <path d="M45 45 Q60 55 75 40" stroke="#78350f" strokeWidth="2" fill="none" opacity="0.6" />
      )}
    </svg>
  );
}

/** Cognitive — lotus / bloom */
export function BrainFlowerGraphic({ health = 50, className = '' }) {
  const { leaf, leafLight, opacity } = plantColors(health);
  const s = scaleForHealth(health);
  const petals = 7;
  const center = { x: 60, y: 70 };
  return (
    <svg viewBox="0 0 120 130" className={className} style={{ transform: `scale(${s})`, opacity }} aria-hidden>
      <ellipse cx="60" cy="118" rx="26" ry="5" fill="currentColor" className="text-violet-900/10" />
      <path d="M58 118 Q60 95 60 88" stroke="#6b7280" strokeWidth="3" fill="none" />
      {[...Array(petals)].map((_, i) => {
        const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
        const x = center.x + Math.cos(a) * 22;
        const y = center.y + Math.sin(a) * 22;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="12"
            ry="20"
            fill={i % 2 ? leafLight : leaf}
            transform={`rotate(${(i * 360) / petals} ${x} ${y})`}
            opacity="0.92"
          />
        );
      })}
      <circle cx={center.x} cy={center.y} r="14" fill="#fbbf24" opacity={0.5 + health / 200} />
    </svg>
  );
}

/** Gut — vines */
export function GutVinesGraphic({ health = 50, className = '' }) {
  const { leaf, leafLight, opacity } = plantColors(health);
  const s = scaleForHealth(health);
  const flowers = health > 55 ? 5 : health > 35 ? 2 : 0;
  return (
    <svg viewBox="0 0 120 130" className={className} style={{ transform: `scale(${s})`, opacity }} aria-hidden>
      <ellipse cx="60" cy="118" rx="30" ry="6" fill="currentColor" className="text-lime-900/10" />
      <path
        d="M20 100 Q40 60 55 75 Q70 90 85 55 Q95 40 100 50"
        stroke={leaf}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M25 85 Q50 95 70 70 Q85 50 95 65"
        stroke={leafLight}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      {[...Array(flowers)].map((_, i) => (
        <circle key={i} cx={32 + i * 16} cy={58 + (i % 2) * 12} r="5" fill={['#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#fb923c'][i % 5]} />
      ))}
    </svg>
  );
}

/** Muscle — trellis vines */
export function MusclePlantGraphic({ health = 50, className = '' }) {
  const { leaf, leafLight, trunk, opacity } = plantColors(health);
  const s = scaleForHealth(health);
  return (
    <svg viewBox="0 0 120 130" className={className} style={{ transform: `scale(${s})`, opacity }} aria-hidden>
      <rect x="48" y="40" width="4" height="78" fill={trunk} rx="1" />
      <rect x="38" y="55" width="44" height="3" fill={trunk} opacity="0.5" />
      <rect x="38" y="75" width="44" height="3" fill={trunk} opacity="0.5" />
      <path d="M52 55 Q65 45 72 58 Q78 72 52 75" stroke={leaf} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M52 78 Q68 68 75 82" stroke={leafLight} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="60" cy="118" rx="24" ry="5" fill="currentColor" className="text-emerald-900/10" />
    </svg>
  );
}

/** Immune — crystal / shield stack */
export function ImmuneShieldGraphic({ health = 50, className = '' }) {
  const h = Math.max(0, Math.min(100, health)) / 100;
  const fill = h > 0.66 ? '#38bdf8' : h > 0.4 ? '#7dd3fc' : '#94a3b8';
  const glow = h > 0.55 ? '#e0f2fe' : '#cbd5e1';
  const s = scaleForHealth(health);
  const opacity = 0.4 + h * 0.6;
  return (
    <svg viewBox="0 0 120 130" className={className} style={{ transform: `scale(${s})`, opacity }} aria-hidden>
      <ellipse cx="60" cy="118" rx="26" ry="5" fill="currentColor" className="text-sky-900/10" />
      <path d="M60 28 L88 40 L88 72 Q88 96 60 108 Q32 96 32 72 L32 40 Z" fill={fill} opacity="0.85" />
      <path d="M60 38 L78 46 L78 68 Q78 88 60 98 Q42 88 42 68 L42 46 Z" fill={glow} opacity="0.5" />
      {health > 70 && (
        <>
          <circle cx="48" cy="52" r="2" fill="white" opacity="0.9" />
          <circle cx="72" cy="58" r="1.5" fill="white" opacity="0.8" />
          <circle cx="58" cy="68" r="1.5" fill="white" opacity="0.7" />
        </>
      )}
    </svg>
  );
}

/** Bones — pillars */
export function BonePillarsGraphic({ health = 50, locked = false, className = '' }) {
  if (locked) {
    return (
      <svg viewBox="0 0 120 130" className={className} style={{ opacity: 0.45 }} aria-hidden>
        <ellipse cx="60" cy="118" rx="28" ry="6" fill="#64748b" opacity="0.15" />
        <rect x="44" y="38" width="10" height="72" rx="2" fill="#94a3b8" />
        <rect x="66" y="48" width="10" height="62" rx="2" fill="#94a3b8" />
        <rect x="52" y="32" width="16" height="10" rx="2" fill="#64748b" />
        <path
          d="M50 55 L70 75 M70 55 L50 75"
          stroke="#475569"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  const { opacity } = plantColors(health);
  const s = scaleForHealth(health);
  const tone = health > 66 ? '#e7e5e4' : health > 40 ? '#d6d3d1' : '#a8a29e';
  return (
    <svg viewBox="0 0 120 130" className={className} style={{ transform: `scale(${s})`, opacity }} aria-hidden>
      <ellipse cx="60" cy="118" rx="28" ry="6" fill="currentColor" className="text-stone-800/10" />
      <rect x="40" y="42" width="14" height="68" rx="3" fill={tone} stroke="#78716c" strokeWidth="1" />
      <rect x="66" y="36" width="14" height="74" rx="3" fill={tone} stroke="#78716c" strokeWidth="1" />
      <rect x="38" y="38" width="18" height="8" rx="2" fill="#fafaf9" stroke="#a8a29e" />
      <rect x="64" y="32" width="18" height="8" rx="2" fill="#fafaf9" stroke="#a8a29e" />
      {health < 40 && <path d="M45 70 L55 80 M55 70 L45 80" stroke="#57534e" strokeWidth="1" />}
    </svg>
  );
}

export const ORGAN_META = {
  heart: { label: 'Heart', subtitle: 'Cardiovascular', Graphic: HeartTreeGraphic },
  brain: { label: 'Brain', subtitle: 'Cognitive', Graphic: BrainFlowerGraphic },
  gut: { label: 'Gut', subtitle: 'Digestive', Graphic: GutVinesGraphic },
  muscle: { label: 'Muscle', subtitle: 'Strength', Graphic: MusclePlantGraphic },
  immune: { label: 'Immune', subtitle: 'Defense', Graphic: ImmuneShieldGraphic },
  bones: { label: 'Bones', subtitle: 'Skeletal', Graphic: BonePillarsGraphic },
};
