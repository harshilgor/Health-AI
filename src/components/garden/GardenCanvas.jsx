import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function plantColors(health) {
  const h = Math.max(0, Math.min(100, health)) / 100;
  const leaf = h > 0.66 ? '#15803d' : h > 0.4 ? '#ca8a04' : '#92400e';
  const leafLight = h > 0.66 ? '#22c55e' : h > 0.4 ? '#eab308' : '#b45309';
  const trunk = h > 0.35 ? '#57534e' : '#78716c';
  return { leaf, leafLight, trunk, h };
}

function HeartTree({ health }) {
  const { leaf, leafLight, trunk, h } = plantColors(health);
  const clusters = Math.min(8, Math.floor(health / 12) + 3);
  const crownR = 12 + h * 12;
  return (
    <g>
      <path d={`M-5,0 Q-6,-20 -4,-40 L4,-40 Q6,-20 5,0 Z`} fill={trunk} />
      <path d="M-3,-15 Q0,-16 3,-15" stroke="#3E2723" strokeWidth="0.5" opacity="0.3" />
      <path d="M-3,-28 Q0,-29 3,-28" stroke="#3E2723" strokeWidth="0.5" opacity="0.3" />
      {Array.from({ length: clusters }).map((_, i) => {
        const a = (i / clusters) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * crownR * 0.7}
            cy={-48 + Math.sin(a) * crownR * 0.6}
            r={8 + h * 4}
            fill={i % 2 ? leafLight : leaf}
            opacity={0.85}
          />
        );
      })}
      <circle cx={0} cy={-48} r={crownR} fill={leaf} opacity={0.9} />
      <circle cx={-6} cy={-42} r={crownR * 0.55} fill={leafLight} opacity={0.85} />
      <circle cx={7} cy={-44} r={crownR * 0.6} fill={leafLight} opacity={0.8} />
      {health > 82 && (
        <path
          d="M0,-56 C-3,-60 -7,-58 -7,-54 C-7,-50 0,-44 0,-44 C0,-44 7,-50 7,-54 C7,-58 3,-60 0,-56 Z"
          fill="#ef4444" opacity={0.8}
        />
      )}
      {health < 40 && (
        <>
          <ellipse cx={-8} cy={-30} rx={2} ry={4} fill="#78350f" opacity={0.5} transform="rotate(20 -8 -30)" />
          <ellipse cx={6} cy={-28} rx={2} ry={4} fill="#78350f" opacity={0.5} transform="rotate(-15 6 -28)" />
        </>
      )}
    </g>
  );
}

function BrainFlower({ health }) {
  const { leaf, leafLight, h } = plantColors(health);
  const petals = Math.min(8, 4 + Math.floor(health / 18));
  const petalR = 6 + h * 5;
  const pColor = h > 0.66 ? '#9333ea' : h > 0.4 ? '#a855f7' : '#c4b5fd';
  const pColorLight = h > 0.66 ? '#a855f7' : h > 0.4 ? '#c084fc' : '#ddd6fe';
  return (
    <g>
      <path d="M0,0 Q-2,-15 -1,-30 Q0,-38 -1,-42" stroke="#6b7280" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx={-5} cy={-12} rx={3} ry={1.5} fill="#4ade80" opacity={0.7} transform="rotate(-20 -5 -12)" />
      <ellipse cx={3} cy={-22} rx={2.5} ry={1.5} fill="#4ade80" opacity={0.7} transform="rotate(15 3 -22)" />
      {Array.from({ length: petals }).map((_, i) => {
        const a = (i / petals) * Math.PI * 2;
        const px = Math.cos(a) * 13;
        const py = -42 + Math.sin(a) * 13;
        const rot = (a * 180) / Math.PI;
        return (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={petalR * 0.7}
            ry={petalR * 1.2}
            fill={i % 2 ? pColorLight : pColor}
            opacity={0.88}
            transform={`rotate(${rot} ${px} ${py})`}
          />
        );
      })}
      <circle cx={0} cy={-42} r={6} fill="#fbbf24" opacity={0.9} />
      <circle cx={0} cy={-42} r={4} fill="#fcd34d" />
      {health > 80 && Array.from({ length: 4 }).map((_, i) => {
        const sa = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const sx = Math.cos(sa) * 20;
        const sy = -42 + Math.sin(sa) * 20;
        return <circle key={i} cx={sx} cy={sy} r={1.2} fill="#fde047" opacity={0.8} />;
      })}
    </g>
  );
}

function GutVines({ health }) {
  const { leaf, leafLight, h } = plantColors(health);
  const flowers = Math.floor(health / 15);
  const colors = ['#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#fb923c'];
  return (
    <g>
      <path
        d="M0,0 Q-8,-10 -5,-20 Q-2,-30 -8,-38 Q-12,-46 -6,-52"
        stroke={leaf} strokeWidth={3 + h} fill="none" strokeLinecap="round"
      />
      <path
        d="M0,0 Q8,-12 5,-22 Q2,-30 7,-38"
        stroke={leafLight} strokeWidth={2 + h * 0.5} fill="none" strokeLinecap="round" opacity={0.85}
      />
      <path d="M-5,-20 Q-2,-22 2,-18" stroke={leaf} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {[
        { x: -6, y: -14 }, { x: -4, y: -28 }, { x: -8, y: -42 },
        { x: 4, y: -16 }, { x: 5, y: -28 }, { x: 7, y: -36 },
      ].map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={2.5} ry={4} fill={leaf} opacity={0.7}
          transform={`rotate(${25 + i * 18} ${p.x} ${p.y})`}
        />
      ))}
      {Array.from({ length: flowers }).map((_, i) => {
        const positions = [
          { x: -5, y: -18 }, { x: -8, y: -34 }, { x: -5, y: -48 },
          { x: 4, y: -14 }, { x: 5, y: -28 }, { x: 7, y: -38 },
        ];
        const p = positions[i % positions.length];
        return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={colors[i % 5]} opacity={0.9} />;
      })}
      {health > 80 && Array.from({ length: 6 }).map((_, i) => (
        <circle key={i} cx={-10 + (i % 3) * 10} cy={-10 - Math.floor(i / 3) * 14} r={0.8}
          fill={colors[i % 5]} opacity={0.5}
        />
      ))}
    </g>
  );
}

function MuscleVines({ health }) {
  const { leaf, leafLight, trunk, h } = plantColors(health);
  const thickness = 2.5 + h * 2;
  const nodes = Math.floor(health / 18);
  return (
    <g>
      <rect x={-12} y={-62} width={24} height={3} rx={1.5} fill={trunk} opacity={0.5} />
      <rect x={-12} y={-40} width={24} height={3} rx={1.5} fill={trunk} opacity={0.5} />
      <rect x={-12} y={-18} width={24} height={3} rx={1.5} fill={trunk} opacity={0.5} />
      <rect x={-10} y={-62} width={2.5} height={62} rx={1.2} fill={trunk} opacity={0.4} />
      <rect x={8} y={-62} width={2.5} height={62} rx={1.2} fill={trunk} opacity={0.4} />
      <path
        d="M-9,0 L-9,-14 Q-9,-20 -6,-26 L-6,-38 Q-6,-44 -9,-50 L-9,-60"
        stroke={leaf} strokeWidth={thickness} fill="none" strokeLinecap="round"
      />
      <path
        d="M9,0 L9,-16 Q9,-22 6,-28 L6,-40 Q6,-46 9,-52 L9,-60"
        stroke={leafLight} strokeWidth={thickness * 0.85} fill="none" strokeLinecap="round"
      />
      <path d="M-6,-26 Q0,-24 6,-28" stroke={leaf} strokeWidth={thickness * 0.5} fill="none" opacity={0.7} />
      <path d="M-6,-44 Q0,-42 6,-46" stroke={leafLight} strokeWidth={thickness * 0.5} fill="none" opacity={0.7} />
      {Array.from({ length: nodes }).map((_, i) => {
        const positions = [
          { x: -9, y: -8 }, { x: 9, y: -14 }, { x: -9, y: -28 },
          { x: 9, y: -34 }, { x: -9, y: -48 }, { x: 9, y: -54 },
        ];
        const p = positions[i % positions.length];
        return <circle key={i} cx={p.x} cy={p.y} r={2} fill={leaf} opacity={0.9} />;
      })}
      {health > 82 && (
        <circle cx={0} cy={-30} r={6} fill="#3b82f6" opacity={0.15} />
      )}
    </g>
  );
}

function ImmuneShield({ health }) {
  const h = Math.max(0, Math.min(100, health)) / 100;
  const fill = h > 0.66 ? '#38bdf8' : h > 0.4 ? '#7dd3fc' : '#94a3b8';
  const glow = h > 0.55 ? '#e0f2fe' : '#cbd5e1';
  return (
    <g>
      {health > 60 && (
        <ellipse cx={0} cy={-28} rx={22} ry={26} fill={glow} opacity={0.2} />
      )}
      <path
        d="M0,-50 L16,-42 L16,-18 Q16,2 0,12 Q-16,2 -16,-18 L-16,-42 Z"
        fill={fill} opacity={0.85}
      />
      <path
        d="M0,-44 L12,-38 L12,-20 Q12,-2 0,6 Q-12,-2 -12,-20 L-12,-38 Z"
        fill={glow} opacity={0.45}
      />
      <rect x={-1.2} y={-36} width={2.4} height={16} rx={1.2} fill="white" opacity={0.55} />
      <rect x={-6.5} y={-30} width={13} height={2.4} rx={1.2} fill="white" opacity={0.55} />
      {health > 70 && Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <circle key={i} cx={Math.cos(a) * 20} cy={-20 + Math.sin(a) * 22}
            r={1.5} fill="white" opacity={0.65}
          />
        );
      })}
      {health < 40 && (
        <g opacity={0.5}>
          <path d="M4,-26 L10,-18 M7,-28 L13,-20" stroke="#ef4444" strokeWidth={0.8} />
          <path d="M-4,-24 L-9,-16 M-7,-26 L-12,-18" stroke="#ef4444" strokeWidth={0.8} />
        </g>
      )}
      <rect x={-2.5} y={10} width={5} height={12} rx={2.5} fill={fill} opacity={0.7} />
      <ellipse cx={0} cy={22} rx={6} ry={3} fill={fill} opacity={0.5} />
    </g>
  );
}

function BonePillars({ health, locked }) {
  if (locked) {
    return (
      <g opacity={0.4}>
        <rect x={-14} y={-42} width={8} height={42} rx={3} fill="#94a3b8" />
        <rect x={-2} y={-52} width={8} height={52} rx={3} fill="#94a3b8" />
        <rect x={10} y={-36} width={8} height={36} rx={3} fill="#94a3b8" />
        <circle cx={2} cy={-22} r={9} fill="#334155" opacity={0.7} />
        <path d="M-2,-22 L-2,-26 Q-2,-29 2,-29 Q6,-29 6,-26 L6,-22" stroke="#e2e8f0" strokeWidth={1.5} fill="none" />
        <rect x={-3} y={-22} width={10} height={7} rx={1} fill="#e2e8f0" />
        <circle cx={2} cy={-19} r={1.5} fill="#334155" />
      </g>
    );
  }
  const h = Math.max(0, Math.min(100, health)) / 100;
  const tone = h > 0.66 ? '#e7e5e4' : h > 0.4 ? '#d6d3d1' : '#a8a29e';
  return (
    <g>
      <rect x={-14} y={-42} width={8} height={42} rx={3} fill={tone} stroke="#78716c" strokeWidth={0.8} />
      <ellipse cx={-10} cy={-42} rx={5} ry={2.5} fill={tone} />
      <rect x={-2} y={-54} width={8} height={54} rx={3} fill={tone} stroke="#78716c" strokeWidth={0.8} />
      <ellipse cx={2} cy={-54} rx={5} ry={2.5} fill={tone} />
      <rect x={10} y={-36} width={8} height={36} rx={3} fill={tone} stroke="#78716c" strokeWidth={0.8} />
      <ellipse cx={14} cy={-36} rx={5} ry={2.5} fill={tone} />
      {health > 60 && (
        <>
          <rect x={-13} y={-28} width={6} height={1.5} fill="white" opacity={0.25} />
          <rect x={-1} y={-38} width={6} height={1.5} fill="white" opacity={0.25} />
          <rect x={11} y={-22} width={6} height={1.5} fill="white" opacity={0.25} />
        </>
      )}
      {health > 82 && (
        <>
          <polygon points="-10,-20 -8,-23 -6,-20 -8,-17" fill="#60a5fa" opacity={0.5} />
          <polygon points="2,-42 4,-45 6,-42 4,-39" fill="#60a5fa" opacity={0.5} />
        </>
      )}
    </g>
  );
}

const PLANT_MAP = { heart: HeartTree, brain: BrainFlower, gut: GutVines, muscle: MuscleVines, immune: ImmuneShield, bones: BonePillars };
const PLANT_LABELS = { heart: 'Heart', brain: 'Brain', gut: 'Gut', muscle: 'Muscle', immune: 'Immune', bones: 'Bones' };

function PlantSlot({ organ, health, locked, x, y, onClick, labelBelow = false }) {
  const Plant = PLANT_MAP[organ];
  const [bounce, setBounce] = useState(false);
  const prevHealth = useRef(health);

  useEffect(() => {
    if (health > prevHealth.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 700);
      prevHealth.current = health;
      return () => clearTimeout(t);
    }
    prevHealth.current = health;
  }, [health]);

  const scale = locked ? 0.7 : 0.72 + (Math.max(0, Math.min(100, health)) / 100) * 0.32;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick(organ)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`${PLANT_LABELS[organ]} plant — ${locked ? 'locked' : health + '% health'}`}
    >
      <g
        style={{
          transform: `scale(${bounce ? scale * 1.12 : scale})`,
          transformOrigin: '0 0',
          transition: bounce ? 'transform 0.35s cubic-bezier(.34,1.56,.64,1)' : 'transform 0.8s ease-out',
        }}
      >
        <Plant health={health} locked={locked} />
      </g>
      {!locked && (
        <text
          x={0}
          y={labelBelow ? 14 : 12}
          textAnchor="middle"
          fill="currentColor"
          className="text-foreground/60"
          fontSize="9"
          fontWeight="600"
          fontFamily="ui-monospace, monospace"
        >
          {health}%
        </text>
      )}
      {locked && (
        <text x={0} y={12} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="system-ui">
          locked
        </text>
      )}
    </g>
  );
}

function ParticleBurst({ x, y, active }) {
  if (!active) return null;
  return (
    <g>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dx = Math.cos(angle) * 18;
        const dy = Math.sin(angle) * 18;
        return (
          <circle key={i} cx={x + dx} cy={y + dy} r={2}
            fill="#fde047" opacity={0.8}
            style={{ animation: 'gardenParticle 0.7s ease-out forwards', animationDelay: `${i * 50}ms` }}
          />
        );
      })}
    </g>
  );
}

export default function GardenCanvas({ garden, environment, onOrganPress }) {
  const g = garden || {};
  const bonesLocked = !g.bones_unlocked;
  const [burstOrgan, setBurstOrgan] = useState(null);

  const avgHealth =
    (['heart', 'brain', 'gut', 'muscle', 'immune'].reduce(
      (s, k) => s + Number(g[k] ?? 50), 0
    )) / 5;

  const skyColors = avgHealth > 70
    ? { top: '#7ec8e3', bottom: '#dff0f7' }
    : avgHealth > 50
      ? { top: '#b0c4de', bottom: '#e4e9f0' }
      : { top: '#95a5a6', bottom: '#d5dbdb' };

  const sunVisible = avgHealth > 65;
  const cloudsVisible = avgHealth <= 70;

  const plantPositions = [
    { organ: 'heart',  x: 65,  y: 220 },
    { organ: 'brain',  x: 155, y: 230 },
    { organ: 'gut',    x: 245, y: 225 },
    { organ: 'muscle', x: 335, y: 222 },
    { organ: 'immune', x: 425, y: 228 },
    { organ: 'bones',  x: 510, y: 226 },
  ];

  const handleOrganClick = (organ) => {
    setBurstOrgan(organ);
    setTimeout(() => setBurstOrgan(null), 800);
    onOrganPress(organ);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-foreground/10 shadow-sm" style={{ aspectRatio: '16/9' }}>
      <svg
        viewBox="0 0 576 324"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyColors.top} />
            <stop offset="100%" stopColor={skyColors.bottom} />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a6b54" />
            <stop offset="100%" stopColor="#5c4d3c" />
          </linearGradient>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7cb342" />
            <stop offset="100%" stopColor="#558b2f" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="576" height="324" fill="url(#sky)" />

        {/* Sun */}
        {sunVisible && (
          <g>
            <circle cx="490" cy="50" r="28" fill="#fde047" opacity={0.25} />
            <circle cx="490" cy="50" r="20" fill="#fcd34d" opacity={0.6} />
            <circle cx="490" cy="50" r="14" fill="#fbbf24" opacity={0.85} />
          </g>
        )}

        {/* Clouds */}
        {cloudsVisible && (
          <g opacity={avgHealth > 60 ? 0.5 : 0.75}>
            <ellipse cx="90" cy="55" rx="36" ry="18" fill="white" opacity="0.7" />
            <ellipse cx="118" cy="50" rx="30" ry="16" fill="white" opacity="0.75" />
            <ellipse cx="75" cy="52" rx="22" ry="14" fill="white" opacity="0.6" />
            <ellipse cx="320" cy="72" rx="40" ry="20" fill="white" opacity="0.55" />
            <ellipse cx="352" cy="67" rx="32" ry="18" fill="white" opacity="0.6" />
          </g>
        )}

        {/* Distant hills */}
        <path d="M0,200 Q80,175 160,195 Q240,210 320,185 Q400,170 480,192 Q540,205 576,195 L576,260 L0,260 Z"
          fill="#8fad6a" opacity="0.35"
        />

        {/* Ground */}
        <path d="M0,240 Q100,225 200,235 Q300,245 400,230 Q500,222 576,232 L576,324 L0,324 Z"
          fill="url(#ground)"
        />

        {/* Grass layer */}
        <path d="M0,240 Q100,225 200,235 Q300,245 400,230 Q500,222 576,232 L576,258 Q500,248 400,256 Q300,268 200,260 Q100,250 0,258 Z"
          fill="url(#grass)"
        />

        {/* Grass blades */}
        {Array.from({ length: 40 }).map((_, i) => {
          const bx = i * 14.5 + 4;
          const by = 242 + Math.sin(i * 0.7) * 6;
          return (
            <path key={i}
              d={`M${bx},${by} Q${bx + 1},${by - 6} ${bx + 2},${by}`}
              fill="#4a7c2e" opacity={0.35}
            />
          );
        })}

        {/* Ground texture — small stones */}
        {[
          { x: 80, y: 268 }, { x: 200, y: 275 }, { x: 340, y: 265 },
          { x: 450, y: 272 }, { x: 140, y: 282 }, { x: 520, y: 278 },
        ].map((s, i) => (
          <ellipse key={i} cx={s.x} cy={s.y} rx={3 + (i % 2)} ry={1.5} fill="#6b5c4a" opacity={0.3} />
        ))}

        {/* Plant shadows */}
        {plantPositions.map(({ organ, x, y }) => (
          <ellipse key={organ + '-shadow'} cx={x} cy={y + 6} rx={16} ry={4} fill="black" opacity={0.08} />
        ))}

        {/* Plants */}
        {plantPositions.map(({ organ, x, y }) => {
          const locked = organ === 'bones' && bonesLocked;
          const health = locked ? 30 : Math.round(Number(g[organ] ?? 50));
          return (
            <PlantSlot
              key={organ}
              organ={organ}
              health={health}
              locked={locked}
              x={x}
              y={y}
              onClick={handleOrganClick}
            />
          );
        })}

        {/* Particle bursts */}
        {burstOrgan && (() => {
          const pos = plantPositions.find(p => p.organ === burstOrgan);
          return pos ? <ParticleBurst x={pos.x} y={pos.y - 30} active /> : null;
        })()}

        {/* Tap hint */}
        <text x="288" y="312" textAnchor="middle" fontSize="8.5" fill="currentColor"
          className="text-foreground/30" fontFamily="system-ui"
        >
          Tap any plant to see details
        </text>
      </svg>

      {/* CSS keyframe for particle animation */}
      <style>{`
        @keyframes gardenParticle {
          0% { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.2) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
