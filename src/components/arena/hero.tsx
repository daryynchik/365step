"use client";

import { useId } from "react";
import { clsx } from "clsx";

import { speciesById, type Expression, type EyeStyle, type Gear, type Look, type Slot } from "@/lib/arena-rules";
import { Armor, Helmet, Pauldron, Sword } from "./hero-gear";
import { DRAW, type Rig } from "./hero-species";

/**
 * One hero, the same everywhere: editor, opponent list and fights. Pure SVG
 * with CSS animation — idle breathing and blinking, and a reaction for each
 * moment of a fight.
 */

export type Mood = "idle" | "attack" | "hit" | "block" | "dodge" | "win" | "lose";

const INK = "#2a2230";
/** The sword leans outwards while resting. */
const SWORD_ANGLE = 22;

type EyeShape = EyeStyle | "happy" | "sad" | "squeeze";
type MouthShape = Expression | "frown" | "ouch";

function faceFor(mood: Mood, look: Look): { eyes: EyeShape; mouth: MouthShape } {
  switch (mood) {
    case "win":
      return { eyes: "happy", mouth: "grin" };
    case "lose":
      return { eyes: "sad", mouth: "frown" };
    case "hit":
      return { eyes: "squeeze", mouth: "ouch" };
    case "attack":
    case "block":
      return { eyes: look.eyes, mouth: "fierce" };
    case "dodge":
      return { eyes: look.eyes, mouth: "surprised" };
    default:
      return { eyes: look.eyes, mouth: look.expression };
  }
}

function Eye({ x, y, r, shape, ink, lid, side }: { x: number; y: number; r: number; shape: EyeShape; ink: string; lid: string; side: -1 | 1 }) {
  const shine = ink === INK ? "#ffffff" : "#ffffff";
  switch (shape) {
    case "happy":
      return <path d={`M${x - r} ${y + 2} Q${x} ${y - r * 1.3} ${x + r} ${y + 2}`} fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round" />;
    case "sad":
      return (
        <g>
          <path d={`M${x - r} ${y - 1} Q${x} ${y + r * 0.9} ${x + r} ${y - 1}`} fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
          {side === 1 && <path d={`M${x + r * 0.6} ${y + 4} q-3 6 0 8 q3 -2 0 -8 Z`} fill="#7cc8ff" />}
        </g>
      );
    case "squeeze":
      return <path d={`M${x - side * r} ${y - r * 0.7} L${x + side * r * 0.6} ${y} L${x - side * r} ${y + r * 0.7}`} fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />;
    case "sparkle":
      return (
        <g>
          <ellipse cx={x} cy={y} rx={r * 0.95} ry={r * 1.15} fill={ink} />
          <circle cx={x - r * 0.3} cy={y - r * 0.4} r={r * 0.4} fill={shine} />
          <circle cx={x + r * 0.35} cy={y + r * 0.45} r={r * 0.18} fill={shine} />
        </g>
      );
    case "sleepy":
      return (
        <g>
          <ellipse cx={x} cy={y + 1} rx={r * 0.85} ry={r * 0.8} fill={ink} />
          <path d={`M${x - r - 1} ${y - r - 2} H${x + r + 1} V${y - 0.5} H${x - r - 1} Z`} fill={lid} />
          <path d={`M${x - r * 0.95} ${y - 0.5} Q${x} ${y + 2} ${x + r * 0.95} ${y - 0.5}`} fill="none" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
          <circle cx={x - r * 0.25} cy={y + r * 0.35} r={r * 0.18} fill={shine} />
        </g>
      );
    case "sharp":
      return (
        <g>
          <path
            d={`M${x - side * r} ${y - r * 0.35} Q${x} ${y - r * 1.05} ${x + side * r} ${y + r * 0.1} Q${x} ${y + r * 0.95} ${x - side * r} ${y - r * 0.35} Z`}
            fill={ink}
          />
          <circle cx={x - r * 0.15} cy={y - r * 0.2} r={r * 0.24} fill={shine} />
        </g>
      );
    case "button":
      return (
        <g>
          <circle cx={x} cy={y} r={r * 0.55} fill={ink} />
          <circle cx={x - r * 0.18} cy={y - r * 0.2} r={r * 0.17} fill={shine} />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx={x} cy={y} rx={r * 0.8} ry={r} fill={ink} />
          <circle cx={x - r * 0.25} cy={y - r * 0.38} r={r * 0.32} fill={shine} />
        </g>
      );
  }
}

function Brows({ rig, mouth, eyes, color }: { rig: Rig; mouth: MouthShape; eyes: EyeShape; color: string }) {
  const { y, dx, r } = rig.eyes;
  const by = y - r * 1.55;
  let tilt = 0; // + inner end down (angry), − inner end up (worried)
  if (mouth === "fierce" || mouth === "ouch") tilt = 4;
  else if (mouth === "frown") tilt = -4;
  else if (eyes === "sharp") tilt = 2.5;
  else if (mouth === "surprised") return (
    <g stroke={color} strokeWidth={3} strokeLinecap="round" fill="none">
      <path d={`M${100 - dx - r * 0.8} ${by - 2} Q${100 - dx} ${by - 6} ${100 - dx + r * 0.8} ${by - 2}`} />
      <path d={`M${100 + dx - r * 0.8} ${by - 2} Q${100 + dx} ${by - 6} ${100 + dx + r * 0.8} ${by - 2}`} />
    </g>
  );
  if (tilt === 0 || by - 4 < rig.brow) return null;
  return (
    <g stroke={color} strokeWidth={3.2} strokeLinecap="round">
      <path d={`M${100 - dx - r * 0.9} ${by - tilt / 2} L${100 - dx + r * 0.9} ${by + tilt / 2}`} />
      <path d={`M${100 + dx + r * 0.9} ${by - tilt / 2} L${100 + dx - r * 0.9} ${by + tilt / 2}`} />
    </g>
  );
}

function Mouth({ rig, shape, accent }: { rig: Rig; shape: MouthShape; accent: string }) {
  const { x, y, s, kind, teeth } = rig.mouth;
  const w = 10 * s;
  if (kind === "beak") {
    const open = shape === "grin" || shape === "surprised" || shape === "fierce" || shape === "ouch";
    return open ? (
      <g fill={accent} stroke="#8a5a14" strokeWidth={1.8} strokeLinejoin="round">
        <path d={`M${x - 8} ${y - 6} L${x + 8} ${y - 6} L${x} ${y + 1} Z`} />
        <path d={`M${x - 6} ${y + 4} L${x + 6} ${y + 4} L${x} ${y + 10} Z`} />
      </g>
    ) : (
      <path d={`M${x - 8} ${y - 5} L${x + 8} ${y - 5} L${x} ${y + 7} Z`} fill={accent} stroke="#8a5a14" strokeWidth={1.8} strokeLinejoin="round" />
    );
  }
  const color = kind === "led" ? accent : INK;
  const stroke = { stroke: color, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const fang = teeth && (shape === "smile" || shape === "grin" || shape === "smirk");
  switch (shape) {
    case "grin":
      return (
        <g>
          <path d={`M${x - w * 1.2} ${y - 3} Q${x} ${y + w * 1.7} ${x + w * 1.2} ${y - 3} Z`} fill={kind === "led" ? accent : "#5a2236"} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
          {kind !== "led" && <ellipse cx={x} cy={y + w * 0.75} rx={w * 0.6} ry={w * 0.32} fill="#f27d8c" />}
          {fang && <path d={`M${x - w * 0.7} ${y - 2} l3 5 l3 -5 M${x + w * 0.1} ${y - 2} l3 5 l3 -5`} fill="#ffffff" />}
        </g>
      );
    case "smirk":
      return (
        <g>
          <path d={`M${x - w} ${y + 2} Q${x + 2} ${y + w * 0.6} ${x + w * 1.1} ${y - 3}`} {...stroke} />
          {fang && <path d={`M${x + w * 0.4} ${y + 1.5} l2.5 5 l2.5 -5.5 Z`} fill="#ffffff" stroke={INK} strokeWidth={1} />}
        </g>
      );
    case "fierce":
    case "ouch":
      return (
        <g>
          <path d={`M${x - w * 1.1} ${y - 3} H${x + w * 1.1} L${x + w * 0.9} ${y + w * 0.7} H${x - w * 0.9} Z`} fill={kind === "led" ? "none" : "#5a2236"} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
          {kind === "led" ? (
            <path d={`M${x - w} ${y + 1} l${w / 2.5} -3 l${w / 2.5} 3 l${w / 2.5} -3 l${w / 2.5} 3 l${w / 2.5} -3`} {...stroke} strokeWidth={2} />
          ) : (
            <path d={`M${x - w * 1.05} ${y - 2} H${x + w * 1.05} V${y + 2} H${x - w * 1.05} Z`} fill="#ffffff" />
          )}
        </g>
      );
    case "calm":
      return <path d={`M${x - w * 0.6} ${y} Q${x} ${y + 4} ${x + w * 0.6} ${y}`} {...stroke} />;
    case "surprised":
      return <ellipse cx={x} cy={y + 2} rx={w * 0.45} ry={w * 0.6} fill={kind === "led" ? "none" : "#5a2236"} stroke={color} strokeWidth={2.4} />;
    case "frown":
      return <path d={`M${x - w * 0.9} ${y + 5} Q${x} ${y - 4} ${x + w * 0.9} ${y + 5}`} {...stroke} />;
    default:
      return (
        <g>
          <path d={`M${x - w} ${y} Q${x} ${y + w * 0.95} ${x + w} ${y}`} {...stroke} />
          {fang && <path d={`M${x - w * 0.5} ${y + 2.5} l2.5 5 l2.5 -4.5 Z M${x + w * 0.5 - 5} ${y + 2.5} l2.5 5 l2.5 -4.5 Z`} fill="#ffffff" stroke={INK} strokeWidth={1} />}
        </g>
      );
  }
}

function Sparkles() {
  const star = (x: number, y: number, s: number, delay: number) => (
    <path
      key={`${x}${y}`}
      className="hero-sparkle"
      style={{ animationDelay: `${delay}ms` }}
      d={`M${x} ${y - 8 * s} L${x + 2 * s} ${y - 2 * s} L${x + 8 * s} ${y} L${x + 2 * s} ${y + 2 * s} L${x} ${y + 8 * s} L${x - 2 * s} ${y + 2 * s} L${x - 8 * s} ${y} L${x - 2 * s} ${y - 2 * s} Z`}
      fill="#f5c542"
    />
  );
  return (
    <g>
      {star(24, 40, 1, 0)}
      {star(182, 60, 0.8, 300)}
      {star(16, 120, 0.7, 600)}
      {star(190, 132, 1, 150)}
    </g>
  );
}

/** One gear item on its own, shaped for this hero, for the upgrade cards. */
export function GearThumb({ slot, level, look, className }: { slot: Slot; level: number; look: Look; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const species = speciesById(look.species) ?? speciesById("cat")!;
  const { rig } = DRAW[species.id](species.palettes[look.palette] ?? species.palettes[0], look.features);
  if (slot === "sword") {
    return (
      <svg viewBox="-36 -100 112 124" className={className} aria-hidden>
        <g transform="rotate(35)">
          <Sword level={level} uid={uid} />
        </g>
      </svg>
    );
  }
  if (slot === "helmet") {
    const w = rig.rim[1] - rig.rim[0] + 36;
    return (
      <svg viewBox={`${rig.rim[0] - 18} ${rig.brow - w * 0.62} ${w} ${w * 0.7}`} className={className} aria-hidden>
        <Helmet rig={rig} level={level} uid={uid} />
      </svg>
    );
  }
  const [x1, x2] = [rig.pauldrons[0][0] - 26, rig.pauldrons[1][0] + 26];
  const [top, bottom] = [Math.min(rig.armor[0], rig.pauldrons[0][1]) - 18, rig.armor[1] + 4];
  const size = Math.max(x2 - x1, bottom - top);
  return (
    <svg viewBox={`${(x1 + x2 - size) / 2} ${(top + bottom - size) / 2} ${size} ${size}`} className={className} aria-hidden>
      <Armor rig={rig} level={level} uid={uid} />
      <Pauldron at={rig.pauldrons[0]} level={level} side={-1} />
      <Pauldron at={rig.pauldrons[1]} level={level} side={1} />
    </svg>
  );
}

export interface HeroProps {
  look: Look;
  gear: Gear;
  mood?: Mood;
  /** "full" shows the whole hero; "bust" crops to head and shoulders for lists; "face" to the face. */
  crop?: "full" | "bust" | "face";
  /** Faces left: used for the defending side of a fight. */
  flip?: boolean;
  className?: string;
  label?: string;
}

export function Hero({ look, gear, mood = "idle", crop = "full", flip = false, className, label }: HeroProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const species = speciesById(look.species) ?? speciesById("cat")!;
  const pal = species.palettes[look.palette] ?? species.palettes[0];
  const parts = DRAW[species.id](pal, look.features);
  const { rig } = parts;
  const face = faceFor(mood, look);
  const ink = rig.eyes.ink ?? INK;
  const viewBox =
    crop === "face" ? `38 ${rig.eyes.y - 56} 124 124` : crop === "bust" ? `10 ${rig.bustTop} 180 180` : "-16 -28 232 250";

  return (
    <svg
      viewBox={viewBox}
      className={clsx("hero", className)}
      data-mood={mood}
      data-crop={crop}
      role="img"
      aria-label={label ?? `${species.name}: ${pal.name.toLowerCase()} расцветка`}
    >
      <g style={flip ? { transform: "scaleX(-1)", transformOrigin: "100px 0px" } : undefined}>
        {crop === "full" && <ellipse cx={100} cy={212} rx={58} ry={8} fill="#1d1c1a" opacity={0.12} className="hero-shadow" />}
        <g className="hero-rig">
          {parts.behind}
          {parts.body}
          <Armor rig={rig} level={gear.armor} uid={uid} />
          {parts.offArm}
          <Pauldron at={rig.pauldrons[0]} level={gear.armor} side={-1} />
          {parts.head}
          <g className="hero-face">
            {rig.eyes.base && (
              <g fill={rig.eyes.base}>
                <circle cx={100 - rig.eyes.dx} cy={rig.eyes.y} r={rig.eyes.r * 1.25} />
                <circle cx={100 + rig.eyes.dx} cy={rig.eyes.y} r={rig.eyes.r * 1.25} />
              </g>
            )}
            <g className={clsx(mood === "idle" && "hero-eyes")}>
              <Eye x={100 - rig.eyes.dx} y={rig.eyes.y} r={rig.eyes.r} shape={face.eyes} ink={rig.eyes.base ? INK : ink} lid={rig.eyes.lid} side={-1} />
              <Eye x={100 + rig.eyes.dx} y={rig.eyes.y} r={rig.eyes.r} shape={face.eyes} ink={rig.eyes.base ? INK : ink} lid={rig.eyes.lid} side={1} />
            </g>
            <Brows rig={rig} mouth={face.mouth} eyes={face.eyes} color={rig.eyes.ink ?? pal.shade} />
            <Mouth rig={rig} shape={face.mouth} accent={pal.accent} />
          </g>
          <Helmet rig={rig} level={gear.helmet} uid={uid} />
          <g className="hero-arm" style={{ transformOrigin: `${rig.shoulder[0]}px ${rig.shoulder[1]}px` }}>
            {parts.arm}
            <g transform={`translate(${rig.hand[0]} ${rig.hand[1]}) rotate(${SWORD_ANGLE})`}>
              <Sword level={gear.sword} uid={uid} />
            </g>
            {parts.hand}
          </g>
          <Pauldron at={rig.pauldrons[1]} level={gear.armor} side={1} />
        </g>
        {mood === "win" && crop === "full" && <Sparkles />}
      </g>
    </svg>
  );
}
