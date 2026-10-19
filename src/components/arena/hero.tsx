"use client";

import { useId } from "react";
import { clsx } from "clsx";

import { speciesById, type Expression, type EyeStyle, type Look } from "@/lib/arena-rules";
import { shopItem, type Outfit, type ShopItem } from "@/lib/shop-items";
import {
  BackItem,
  BackItemFront,
  Background,
  ChestItem,
  ColorDefs,
  colorway,
  Frame,
  Glasses,
  HandItem,
  Hat,
  Neckwear,
  PatternDefs,
  VictoryEffect,
} from "./hero-accessories";
import { DRAW, type Rig } from "./hero-species";

/**
 * One hero, the same everywhere: wardrobe, shop, race track and results. Pure
 * SVG with CSS animation — calm breathing and blinking while waiting, and a
 * reaction for each moment of a race. Accessories are decorative only.
 */

export type Mood = "idle" | "run" | "think" | "correct" | "wrong" | "win" | "lose";

const INK = "#2a2230";
/** Held items lean outwards. */
const HOLD_ANGLE = 22;

type EyeShape = EyeStyle | "happy" | "sad" | "squeeze";
type MouthShape = Expression | "frown" | "ouch";

function faceFor(mood: Mood, look: Look): { eyes: EyeShape; mouth: MouthShape } {
  switch (mood) {
    case "win":
    case "correct":
      return { eyes: "happy", mouth: "grin" };
    case "lose":
      return { eyes: "sad", mouth: "frown" };
    case "wrong":
      return { eyes: "squeeze", mouth: "ouch" };
    case "run":
      return { eyes: look.eyes, mouth: "grin" };
    case "think":
      return { eyes: look.eyes, mouth: "calm" };
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

export interface HeroProps {
  look: Look;
  outfit?: Outfit;
  mood?: Mood;
  /** "full" shows the whole hero; "bust" crops to head and shoulders; "face" to the face. */
  crop?: "full" | "bust" | "face";
  /** Draws the equipped background and frame (full view only). */
  scene?: boolean;
  /** Faces left: the second lane of a race. */
  flip?: boolean;
  /** No idle animation, for long lists. */
  still?: boolean;
  className?: string;
  label?: string;
}

export function Hero({ look, outfit = {}, mood = "idle", crop = "full", scene = false, flip = false, still = false, className, label }: HeroProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const species = speciesById(look.species) ?? speciesById("cat")!;
  const base = species.palettes[look.palette] ?? species.palettes[0];
  const wear = (slot: keyof Outfit): ShopItem | undefined => {
    const id = outfit[slot];
    const it = id ? shopItem(id) : undefined;
    return it && it.slot === slot ? it : undefined;
  };
  const color = wear("color");
  const pattern = wear("pattern");
  const pal = color ? { ...base, ...colorway(color, uid) } : base;
  const parts = DRAW[species.id](pal, look.features);
  const { rig } = parts;
  const face = faceFor(mood, look);
  const ink = rig.eyes.ink ?? INK;
  const full = crop === "full";
  const viewBox =
    crop === "face" ? `38 ${rig.eyes.y - 56} 124 124` : crop === "bust" ? `10 ${rig.bustTop} 180 180` : "-16 -28 232 250";
  const [head, glasses, neck, chest, back, hand, background, frame, effect] = (
    ["head", "face", "neck", "chest", "back", "hand", "background", "frame", "effect"] as const
  ).map(wear);
  // One-piece heroes get the body pattern once; the robot's head is its screen-face, so it stays plain.
  const patternHead = rig.head !== rig.body && species.id !== "robot";

  return (
    <svg
      viewBox={viewBox}
      className={clsx("hero", still && "hero-still", className)}
      data-mood={mood}
      data-crop={crop}
      data-scene={full && scene && background ? "on" : undefined}
      role="img"
      aria-label={label ?? `${species.name}: ${pal.name.toLowerCase()} расцветка`}
    >
      <defs>
        {color && <ColorDefs it={color} uid={uid} />}
        {pattern && <PatternDefs it={pattern} uid={uid} />}
        <clipPath id={`${uid}-box`}>
          <rect x={-16} y={-28} width={232} height={250} rx={18} />
        </clipPath>
      </defs>
      {full && scene && background && (
        <g clipPath={`url(#${uid}-box)`}>
          <Background it={background} />
        </g>
      )}
      {full && mood === "win" && effect?.art === "rainbow" && <VictoryEffect it={effect} />}
      <g style={flip ? { transform: "scaleX(-1)", transformOrigin: "100px 0px" } : undefined}>
        {full && <ellipse cx={100} cy={212} rx={58} ry={8} fill="#1d1c1a" opacity={0.12} className="hero-shadow" />}
        <g className="hero-rig">
          {back && <BackItem it={back} rig={rig} />}
          {parts.behind}
          {parts.body}
          {pattern && <path d={rig.body} fill={`url(#${uid}-pat)`} opacity={0.45} pointerEvents="none" />}
          {parts.offArm}
          {back && <BackItemFront it={back} rig={rig} />}
          {parts.head}
          {pattern && patternHead && <path d={rig.head} fill={`url(#${uid}-pat)`} opacity={0.45} pointerEvents="none" />}
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
          {neck && <Neckwear it={neck} rig={rig} />}
          {chest && <ChestItem it={chest} rig={rig} />}
          {glasses && <Glasses it={glasses} rig={rig} />}
          {head && <Hat it={head} rig={rig} uid={uid} />}
          <g className="hero-arm" style={{ transformOrigin: `${rig.shoulder[0]}px ${rig.shoulder[1]}px` }}>
            {parts.arm}
            {hand && (
              <g transform={`translate(${rig.hand[0]} ${rig.hand[1]}) rotate(${HOLD_ANGLE})`}>
                <HandItem it={hand} />
              </g>
            )}
            {parts.hand}
          </g>
        </g>
      </g>
      {full && mood === "win" && (effect ? effect.art !== "rainbow" && <VictoryEffect it={effect} /> : <Sparkles />)}
      {full && scene && frame && <Frame it={frame} />}
    </svg>
  );
}
