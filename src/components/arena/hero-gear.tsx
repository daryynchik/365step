/**
 * Gear drawn onto a hero's rig. The helmet is the head outline, slightly
 * enlarged and cut at the brow; armour is the body outline cut into a band
 * below the mouth. Both therefore follow any shape — a round head, a robot's
 * box, an owl's or a slime's one-piece body — and never cover the face.
 * Every tier (simple → legendary) has its own materials and details.
 */

import { tierOf, type TierId } from "@/lib/arena-rules";
import type { Rig } from "./hero-species";

interface Metal {
  base: string;
  dark: string;
  light: string;
  trim: string;
}

export const METALS: Record<TierId, Metal> = {
  simple: { base: "#a5743f", dark: "#6b4423", light: "#d2a46b", trim: "#7d5130" },
  iron: { base: "#8f979f", dark: "#535a62", light: "#c9cfd5", trim: "#6d747c" },
  steel: { base: "#cdd7e2", dark: "#6f7e90", light: "#f7f9fc", trim: "#5d8fd6" },
  magic: { base: "#5a49c6", dark: "#2b2180", light: "#a898ff", trim: "#7ef0ff" },
  legendary: { base: "#f0bf45", dark: "#9c6c12", light: "#fff3bf", trim: "#e0475b" },
};

function Gradient({ id, metal, vertical = true }: { id: string; metal: Metal; vertical?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      <stop offset="0" stopColor={metal.light} />
      <stop offset="0.45" stopColor={metal.base} />
      <stop offset="1" stopColor={metal.dark} />
    </linearGradient>
  );
}

function Gem({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <g>
      <path d={`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`} fill={color} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.2} />
      <path d={`M${x - r * 0.35} ${y - r * 0.2} L${x} ${y - r * 0.6}`} stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

function Wing({ x, y, flip, metal }: { x: number; y: number; flip: 1 | -1; metal: Metal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
      <path d="M0 0 C-10 -4 -20 -14 -24 -28 C-16 -24 -12 -22 -8 -22 C-14 -18 -14 -14 -12 -10 C-8 -10 -4 -8 0 -4 Z" fill={metal.light} stroke={metal.dark} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

export function Helmet({ rig, level, uid }: { rig: Rig; level: number; uid: string }) {
  const tier = tierOf(level);
  const m = METALS[tier];
  const [cx, cy] = rig.headCenter;
  const scale = `translate(${cx} ${cy}) scale(1.08) translate(${-cx} ${-cy})`;
  const clip = `${uid}-helm`;
  const shape = `${uid}-helm-s`;
  const grad = `${uid}-helm-g`;
  const [x1, x2] = rig.rim;
  const mid = (x1 + x2) / 2;
  return (
    <g className="hero-helmet">
      <defs>
        <clipPath id={clip}>
          <rect x={-40} y={-60} width={280} height={rig.brow + 60} />
        </clipPath>
        <clipPath id={shape}>
          <path d={rig.head} transform={scale} />
        </clipPath>
        <Gradient id={grad} metal={m} />
      </defs>
      <g clipPath={`url(#${clip})`}>
        <path d={rig.head} transform={scale} fill={`url(#${grad})`} stroke={m.dark} strokeWidth={3} strokeLinejoin="round" />
        <g clipPath={`url(#${shape})`}>
        {tier === "simple" && (
          <path d={`M${mid} -40 V${rig.brow}`} stroke={m.dark} strokeWidth={2} strokeDasharray="4 4" />
        )}
        {tier === "iron" && <rect x={mid - 5} y={-40} width={10} height={rig.brow + 40} fill={m.dark} opacity={0.35} />}
        {tier === "steel" && (
          <g>
            <rect x={mid - 6} y={-40} width={12} height={rig.brow + 40} fill={m.light} stroke={m.dark} strokeWidth={1.5} />
            <path d={`M${x1 + 14} ${rig.brow - 16} Q${mid - 16} ${rig.brow - 30} ${mid - 14} ${rig.brow - 40}`} stroke="#ffffff" strokeOpacity={0.8} strokeWidth={3} strokeLinecap="round" fill="none" />
          </g>
        )}
        {tier === "magic" && (
          <g>
            <path d={`M${x1 + 10} ${rig.brow - 14} H${x2 - 10}`} stroke={m.trim} strokeWidth={1.5} strokeDasharray="2 5" opacity={0.9} />
            <circle cx={mid - 26} cy={rig.brow - 24} r={2} fill={m.trim} />
            <circle cx={mid + 22} cy={rig.brow - 30} r={1.6} fill="#ffffff" />
          </g>
        )}
        {tier === "legendary" && (
          <g>
            <rect x={mid - 6} y={-40} width={12} height={rig.brow + 40} fill={m.light} opacity={0.8} />
            <path d={`M${x1 + 12} ${rig.brow - 18} Q${mid - 14} ${rig.brow - 34} ${mid - 10} ${rig.brow - 44}`} stroke="#ffffff" strokeOpacity={0.85} strokeWidth={3} strokeLinecap="round" fill="none" />
          </g>
        )}
        </g>
        <path d={rig.head} transform={scale} fill="none" stroke={m.dark} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <rect x={x1} y={rig.brow - 8} width={x2 - x1} height={10} rx={5} fill={tier === "simple" ? m.trim : m.dark} stroke={m.dark} strokeWidth={2} />
      {tier === "iron" &&
        [0.15, 0.32, 0.5, 0.68, 0.85].map((t) => <circle key={t} cx={x1 + (x2 - x1) * t} cy={rig.brow - 3} r={2} fill={m.light} />)}
      {tier === "steel" && <rect x={x1 + 4} y={rig.brow - 6} width={x2 - x1 - 8} height={3} rx={1.5} fill={m.trim} opacity={0.8} />}
      {tier === "magic" && (
        <g>
          <circle cx={mid} cy={rig.brow - 18} r={9} fill={m.trim} opacity={0.35} className="hero-glow" />
          <Gem x={mid} y={rig.brow - 18} r={6} color={m.trim} />
        </g>
      )}
      {tier === "legendary" && (
        <g>
          <Wing x={x1 + 4} y={rig.brow - 6} flip={1} metal={m} />
          <Wing x={x2 - 4} y={rig.brow - 6} flip={-1} metal={m} />
          <Gem x={mid} y={rig.brow - 3} r={6} color={m.trim} />
        </g>
      )}
    </g>
  );
}

export function Armor({ rig, level, uid }: { rig: Rig; level: number; uid: string }) {
  const tier = tierOf(level);
  const m = METALS[tier];
  const [top, bottom] = rig.armor;
  const clip = `${uid}-arm`;
  const band = `${uid}-band`;
  const grad = `${uid}-arm-g`;
  const h = bottom - top;
  const rows = Array.from({ length: Math.max(1, Math.floor(h / 12)) }, (_, i) => top + 12 * (i + 1)).filter((y) => y < bottom - 6);
  return (
    <g className="hero-armor">
      <defs>
        <clipPath id={clip}>
          <path d={rig.body} />
        </clipPath>
        <clipPath id={band}>
          <rect x={-40} y={top} width={280} height={h} />
        </clipPath>
        <Gradient id={grad} metal={m} vertical={false} />
      </defs>
      <g clipPath={`url(#${band})`}>
        <g clipPath={`url(#${clip})`}>
          <rect x={-40} y={top} width={280} height={h} fill={`url(#${grad})`} />
          {tier === "simple" && (
            <g>
              <path d={`M100 ${top} V${bottom}`} stroke={m.dark} strokeWidth={2} />
              {rows.map((y) => (
                <path key={y} d={`M94 ${y - 4} L106 ${y + 2} M106 ${y - 4} L94 ${y + 2}`} stroke={m.light} strokeWidth={2} strokeLinecap="round" />
              ))}
              <path d={`M-40 ${top + 4} H240`} stroke={m.dark} strokeWidth={1.5} strokeDasharray="3 4" />
            </g>
          )}
          {tier === "iron" &&
            rows.map((y) => (
              <g key={y}>
                <path d={`M-40 ${y} H240`} stroke={m.dark} strokeWidth={2} />
                {[70, 90, 110, 130].map((x) => (
                  <circle key={x} cx={x + ((y / 12) % 2) * 10} cy={y - 6} r={1.6} fill={m.light} />
                ))}
              </g>
            ))}
          {tier === "steel" && (
            <g>
              <path d={`M100 ${top} V${bottom}`} stroke={m.light} strokeWidth={5} />
              <path d={`M100 ${top} V${bottom}`} stroke={m.dark} strokeWidth={1.2} />
              {rows.map((y) => (
                <path key={y} d={`M-40 ${y} Q100 ${y + 8} 240 ${y}`} stroke={m.dark} strokeWidth={1.5} fill="none" opacity={0.7} />
              ))}
            </g>
          )}
          {tier === "magic" && (
            <g>
              {rows.map((y) => (
                <path key={y} d={`M-40 ${y} Q100 ${y + 8} 240 ${y}`} stroke={m.trim} strokeWidth={1.4} fill="none" opacity={0.7} />
              ))}
              <circle cx={100} cy={top + h / 2} r={Math.min(10, h / 3)} fill="none" stroke={m.trim} strokeWidth={2} className="hero-glow" />
              <Gem x={100} y={top + h / 2} r={Math.min(6, h / 5)} color={m.trim} />
            </g>
          )}
          {tier === "legendary" && (
            <g>
              {rows.map((y) => (
                <path key={y} d={`M-40 ${y} Q100 ${y + 8} 240 ${y}`} stroke={m.dark} strokeWidth={1.4} fill="none" opacity={0.6} />
              ))}
              <circle cx={100} cy={top + h / 2} r={Math.min(12, h / 2.6)} fill={m.light} stroke={m.dark} strokeWidth={2} />
              <Gem x={100} y={top + h / 2} r={Math.min(7, h / 4.5)} color={m.trim} />
            </g>
          )}
          <rect x={-40} y={bottom - 6} width={280} height={6} fill={tier === "legendary" ? m.trim : m.dark} />
        </g>
        <path d={rig.body} fill="none" stroke={m.dark} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <g clipPath={`url(#${clip})`}>
        <path d={`M-40 ${top} H240`} stroke={m.dark} strokeWidth={3} />
      </g>
    </g>
  );
}

/** Shoulder pads from steel up, drawn over the arms. */
export function Pauldron({ at, level, side }: { at: [number, number]; level: number; side: 1 | -1 }) {
  const tier = tierOf(level);
  if (tier === "simple" || tier === "iron") return null;
  const m = METALS[tier];
  const [x, y] = at;
  return (
    <g>
      <path d={`M${x - 13} ${y + 4} Q${x - 12} ${y - 12} ${x} ${y - 12} Q${x + 12} ${y - 12} ${x + 13} ${y + 4} Q${x} ${y} ${x - 13} ${y + 4} Z`} fill={m.base} stroke={m.dark} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M${x - 8} ${y - 4} Q${x} ${y - 10} ${x + 8} ${y - 4}`} stroke={m.light} strokeWidth={2} fill="none" strokeLinecap="round" />
      {tier === "magic" && <circle cx={x} cy={y - 4} r={2.4} fill={m.trim} />}
      {tier === "legendary" && <path d={`M${x + side * 6} ${y - 10} L${x + side * 14} ${y - 22} L${x + side * 12} ${y - 8} Z`} fill={m.light} stroke={m.dark} strokeWidth={1.5} strokeLinejoin="round" />}
    </g>
  );
}

/** A sword with its grip at the origin and the blade pointing up. */
export function Sword({ level, uid }: { level: number; uid: string }) {
  const tier = tierOf(level);
  const grad = `${uid}-blade`;
  const glow = `${uid}-glow`;
  switch (tier) {
    case "simple":
      return (
        <g>
          <path d="M-5 -14 L-5 -56 Q0 -66 5 -56 L5 -14 Z" fill="#dcae72" stroke="#7d5130" strokeWidth={2} strokeLinejoin="round" />
          <path d="M-1 -20 Q1 -34 -1 -50" stroke="#a5743f" strokeWidth={1.4} fill="none" />
          <rect x={-12} y={-16} width={24} height={6} rx={3} fill="#8a5a33" stroke="#5e3b1f" strokeWidth={1.5} />
          <rect x={-3.5} y={-10} width={7} height={20} rx={3} fill="#6b4423" />
          <circle cy={12} r={4} fill="#8a5a33" stroke="#5e3b1f" strokeWidth={1.5} />
        </g>
      );
    case "iron":
      return (
        <g>
          <path d="M-5.5 -14 L-5.5 -66 L0 -76 L5.5 -66 L5.5 -14 Z" fill="#c8ced5" stroke="#535a62" strokeWidth={2} strokeLinejoin="round" />
          <path d="M0 -18 V-66" stroke="#8f979f" strokeWidth={1.6} />
          <rect x={-15} y={-17} width={30} height={6} rx={2} fill="#6d747c" stroke="#3f454c" strokeWidth={1.5} />
          <rect x={-3.5} y={-11} width={7} height={21} rx={3} fill="#3a3a40" />
          <circle cy={12} r={4.2} fill="#8f979f" stroke="#3f454c" strokeWidth={1.5} />
        </g>
      );
    case "steel":
      return (
        <g>
          <defs>
            <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#dfe6ee" />
              <stop offset="1" stopColor="#9aa9ba" />
            </linearGradient>
          </defs>
          <path d="M-6 -14 L-6 -74 L0 -86 L6 -74 L6 -14 Z" fill={`url(#${grad})`} stroke="#5d6b7c" strokeWidth={2} strokeLinejoin="round" />
          <path d="M0 -20 V-74" stroke="#7d8b9c" strokeWidth={1.6} />
          <path d="M-18 -12 Q0 -22 18 -12 L18 -17 Q0 -27 -18 -17 Z" fill="#9aa9ba" stroke="#4f5d6e" strokeWidth={1.5} strokeLinejoin="round" />
          <rect x={-3.5} y={-12} width={7} height={22} rx={3} fill="#2d3748" />
          <path d="M-3.5 -6 L3.5 -2 M-3.5 0 L3.5 4" stroke="#5d8fd6" strokeWidth={1.4} />
          <circle cy={12.5} r={4.5} fill="#5d8fd6" stroke="#2d3748" strokeWidth={1.5} />
        </g>
      );
    case "magic":
      return (
        <g>
          <defs>
            <linearGradient id={grad} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#7a5cff" />
              <stop offset="1" stopColor="#b8fbff" />
            </linearGradient>
            <filter id={glow} x="-2" y="-0.5" width="5" height="2">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <path d="M-8 -14 L-8 -78 L0 -94 L8 -78 L8 -14 Z" fill="#7ef0ff" opacity={0.75} filter={`url(#${glow})`} className="hero-glow" />
          <path d="M-6 -14 L-6 -78 L0 -92 L6 -78 L6 -14 Z" fill={`url(#${grad})`} stroke="#2b2180" strokeWidth={2} strokeLinejoin="round" />
          <g fill="#ffffff">
            <circle cy={-34} r={1.6} />
            <circle cy={-50} r={1.6} />
            <circle cy={-66} r={1.6} />
          </g>
          <path d="M-17 -14 Q-10 -22 0 -18 Q10 -22 17 -14 L14 -10 Q0 -16 -14 -10 Z" fill="#5a49c6" stroke="#2b2180" strokeWidth={1.5} strokeLinejoin="round" />
          <Gem x={0} y={-15} r={4} color="#7ef0ff" />
          <rect x={-3.5} y={-10} width={7} height={21} rx={3} fill="#2b2180" />
          <circle cy={13} r={4.5} fill="#a898ff" stroke="#2b2180" strokeWidth={1.5} />
        </g>
      );
    case "legendary":
      return (
        <g>
          <defs>
            <linearGradient id={grad} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#f5c542" />
              <stop offset="1" stopColor="#fffbe6" />
            </linearGradient>
            <filter id={glow} x="-2" y="-0.5" width="5" height="2">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <path d="M-11 -14 L-11 -82 L0 -104 L11 -82 L11 -14 Z" fill="#ff9a1f" opacity={0.7} filter={`url(#${glow})`} className="hero-glow" />
          <path d="M-7 -14 L-7 -84 L0 -100 L7 -84 L7 -14 Z" fill={`url(#${grad})`} stroke="#9c6c12" strokeWidth={2} strokeLinejoin="round" />
          <path d="M0 -20 V-84" stroke="#e0a82e" strokeWidth={1.8} />
          <path d="M-4 -40 L4 -40 M-4 -60 L4 -60" stroke="#e0475b" strokeWidth={1.6} strokeLinecap="round" />
          <path d="M0 -16 C-8 -16 -16 -20 -24 -30 C-18 -28 -14 -28 -12 -28 C-16 -24 -14 -20 -10 -18 Z" fill="#fff3bf" stroke="#9c6c12" strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M0 -16 C8 -16 16 -20 24 -30 C18 -28 14 -28 12 -28 C16 -24 14 -20 10 -18 Z" fill="#fff3bf" stroke="#9c6c12" strokeWidth={1.5} strokeLinejoin="round" />
          <rect x={-14} y={-18} width={28} height={6} rx={3} fill="#f0bf45" stroke="#9c6c12" strokeWidth={1.5} />
          <rect x={-3.5} y={-12} width={7} height={22} rx={3} fill="#7a2030" />
          <Gem x={0} y={14} r={5.5} color="#e0475b" />
        </g>
      );
  }
}
