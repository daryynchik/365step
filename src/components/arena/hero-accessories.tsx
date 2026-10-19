/**
 * Shop accessories drawn onto a hero's rig (hero-species.tsx). Positions come
 * from the rig, never from fixed coordinates, so the same item fits a cat, an
 * owl, a slime or a robot:
 *   hats      — the crown of the head (rig.top), scaled to the head width;
 *               caps and beanies are the head outline cut above the brow
 *   glasses   — on the eyes (rig.eyes)
 *   neck      — on the neck line below the mouth (rig.neck)
 *   chest     — just under the neck line
 *   back      — from the shoulders (rig.pauldrons), behind the body
 *   hand      — held in the item hand (rig.hand), the paw drawn over it
 * Colours, patterns, backgrounds, frames and victory effects are here too.
 */

import type { ReactNode } from "react";

import type { ShopItem } from "@/lib/shop-items";
import type { Rig } from "./hero-species";

type Pt = [number, number];

const STD_WIDTH = 112;

function star(cx: number, cy: number, r: number, inner = 0.45, points = 5): string {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + "Z";
}

function heart(cx: number, cy: number, s: number): string {
  return `M${cx} ${cy + 9 * s} C${cx - 14 * s} ${cy} ${cx - 12 * s} ${cy - 12 * s} ${cx - 4.5 * s} ${cy - 11 * s} C${cx - 2 * s} ${cy - 11 * s} ${cx} ${cy - 9 * s} ${cx} ${cy - 7 * s} C${cx} ${cy - 9 * s} ${cx + 2 * s} ${cy - 11 * s} ${cx + 4.5 * s} ${cy - 11 * s} C${cx + 12 * s} ${cy - 12 * s} ${cx + 14 * s} ${cy} ${cx} ${cy + 9 * s} Z`;
}

const ink = { strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Trigonometry can differ in the last digits between the server and the browser; rounding keeps hydration stable. */
const r2 = (n: number) => Math.round(n * 100) / 100;

function flower(cx: number, cy: number, r: number, color: string, center = "#ffd84d", key?: string) {
  return (
    <g key={key ?? `${cx}${cy}`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={r2(cx + Math.cos((a * Math.PI) / 180) * r)} cy={r2(cy + Math.sin((a * Math.PI) / 180) * r)} r={r2(r * 0.75)} fill={color} />
      ))}
      <circle cx={cx} cy={cy} r={r2(r * 0.6)} fill={center} />
    </g>
  );
}

// ------------------------------------------------------------------ hats --

/** Head outline, slightly larger, cut above a line: a cap that hugs any head. */
function HeadCap({ rig, uid, cut, fill, line, children }: { rig: Rig; uid: string; cut: number; fill: string; line: string; children?: ReactNode }) {
  const [cx, cy] = rig.headCenter;
  const scale = `translate(${cx} ${cy}) scale(1.07) translate(${-cx} ${-cy})`;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-cap`}>
          <rect x={-40} y={-60} width={280} height={cut + 60} />
        </clipPath>
        <clipPath id={`${uid}-caps`}>
          <path d={rig.head} transform={scale} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-cap)`}>
        <path d={rig.head} transform={scale} fill={fill} stroke={line} strokeWidth={3} {...ink} />
        <g clipPath={`url(#${uid}-caps)`}>{children}</g>
      </g>
    </g>
  );
}

export function Hat({ it, rig, uid }: { it: ShopItem; rig: Rig; uid: string }) {
  const [c1, c2 = c1, c3 = "#ffffff"] = it.colors;
  const w = rig.rim[1] - rig.rim[0];
  const s = w / STD_WIDTH;
  const top = rig.top;
  const cut = Math.round(top + (rig.brow - top) * 0.72);
  // Hats drawn for a standard head: origin at the crown, unit width 112.
  const at = (children: ReactNode, dy = 0) => <g transform={`translate(100 ${top + dy}) scale(${s})`}>{children}</g>;

  switch (it.art) {
    case "cap":
    case "cap-logo":
      return (
        <g>
          <HeadCap rig={rig} uid={uid} cut={cut} fill={c1} line={c2}>
            <path d={`M100 ${top - 10} V${cut}`} stroke={c2} strokeWidth={2} opacity={0.5} />
            {it.art === "cap-logo" && (
              <text x={100} y={cut - 7} textAnchor="middle" fontSize={11 * s} fontWeight={800} fill={c3} fontFamily="system-ui, sans-serif">
                365
              </text>
            )}
          </HeadCap>
          <path d={`M${100 - w * 0.1} ${cut} Q${100 + w * 0.3} ${cut - 4} ${100 + w * 0.62} ${cut + 7} Q${100 + w * 0.3} ${cut + 13} ${100 - w * 0.1} ${cut + 5} Z`} fill={c2} stroke={c2} strokeWidth={2} {...ink} />
          <rect x={rig.rim[0] + 2} y={cut - 3} width={w - 4} height={6} rx={3} fill={c2} />
          <circle cx={100} cy={top - 1} r={4 * s} fill={c2} />
        </g>
      );
    case "beanie":
      return (
        <g>
          <HeadCap rig={rig} uid={uid} cut={cut} fill={c1} line="#9e2b1d">
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M${rig.rim[0] + (w / 8) * i} ${top - 20} V${cut}`} stroke="#ffffff" strokeOpacity={0.25} strokeWidth={3} />
            ))}
          </HeadCap>
          <rect x={rig.rim[0] - 3} y={cut - 10} width={w + 6} height={13} rx={6.5} fill={c1} stroke="#9e2b1d" strokeWidth={2.5} />
          <circle cx={100} cy={top - 6} r={10 * s} fill={c2} stroke="#c9c9c9" strokeWidth={2} />
        </g>
      );
    case "bucket":
    case "bucket-flowers": {
      const band = Math.round(top + (rig.brow - top) * 0.55);
      return (
        <g>
          <HeadCap rig={rig} uid={uid} cut={band} fill={c1} line={c2} />
          <path d={`M${100 - w * 0.68} ${band + 9} Q100 ${band - 10} ${100 + w * 0.68} ${band + 9} Q100 ${band + 16} ${100 - w * 0.68} ${band + 9} Z`} fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          <rect x={rig.rim[0] + 4} y={band - 7} width={w - 8} height={7} rx={3} fill={c2} opacity={0.8} />
          {it.art === "bucket-flowers" && [0.3, 0.5, 0.7].map((t) => flower(rig.rim[0] + w * t, band - 4, 3.2 * s, "#ffffff", c3, `f${t}`))}
        </g>
      );
    }
    case "beret":
      return at(
        <g transform="rotate(-10)">
          <ellipse cx={6} cy={2} rx={52} ry={15} fill={c1} stroke={c2} strokeWidth={3} />
          <path d="M-40 8 Q6 18 52 8" fill="none" stroke={c2} strokeWidth={3} opacity={0.5} />
          <path d="M6 -13 l0 -7" stroke={c2} strokeWidth={4} strokeLinecap="round" />
        </g>,
        4,
      );
    case "crown":
      return at(
        <g>
          <path d="M-30 10 L-34 -20 L-17 -6 L0 -28 L17 -6 L34 -20 L30 10 Z" fill={c1} stroke={c2} strokeWidth={3} {...ink} />
          <rect x={-31} y={4} width={62} height={9} rx={3} fill={c1} stroke={c2} strokeWidth={2.5} />
          <circle cx={0} cy={-6} r={4.5} fill={c3} />
          <circle cx={-34} cy={-21} r={3.5} fill={c1} stroke={c2} strokeWidth={2} />
          <circle cx={34} cy={-21} r={3.5} fill={c1} stroke={c2} strokeWidth={2} />
          <circle cx={0} cy={-29} r={3.5} fill={c1} stroke={c2} strokeWidth={2} />
          <path d="M-22 -2 L-18 6 M18 -2 L22 6" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={2} />
        </g>,
        2,
      );
    case "tiara":
      return at(
        <g>
          <path d="M-36 10 Q0 -6 36 10" fill="none" stroke={c2} strokeWidth={6} strokeLinecap="round" />
          <path d="M-36 10 Q0 -6 36 10" fill="none" stroke={c1} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M-14 2 L-8 -8 L0 -20 L8 -8 L14 2" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          <path d="M0 -14 L5 -7 L0 0 L-5 -7 Z" fill={c3} />
          <circle cx={-24} cy={2} r={2.5} fill={c3} />
          <circle cx={24} cy={2} r={2.5} fill={c3} />
        </g>,
        6,
      );
    case "party":
    case "party-dots":
      return at(
        <g transform="rotate(-10)">
          <path d="M-20 8 L0 -48 L20 8 Z" fill={c1} stroke="#00000033" strokeWidth={2} {...ink} />
          {it.art === "party" ? (
            <g clipPath={`url(#${uid}-cone)`}>
              <defs>
                <clipPath id={`${uid}-cone`}>
                  <path d="M-20 8 L0 -48 L20 8 Z" />
                </clipPath>
              </defs>
              {[-30, -14, 2].map((y) => (
                <path key={y} d={`M-30 ${y + 14} L30 ${y}`} stroke={c2} strokeWidth={6} />
              ))}
            </g>
          ) : (
            <g fill={c2}>
              <circle cx={-6} cy={-6} r={3} />
              <circle cx={6} cy={-20} r={2.6} />
              <circle cx={8} cy={2} r={3} />
              <circle cx={-2} cy={-32} r={2.2} />
            </g>
          )}
          <circle cx={0} cy={-50} r={6} fill={c3} stroke="#00000022" strokeWidth={1.5} />
        </g>,
        6,
      );
    case "tophat":
      return at(
        <g>
          <ellipse cx={0} cy={6} rx={42} ry={7} fill={c1} stroke="#000" strokeWidth={2} />
          <rect x={-27} y={-40} width={54} height={46} rx={4} fill={c1} stroke="#000" strokeWidth={2} />
          <rect x={-27} y={-6} width={54} height={8} fill={c2} />
          <path d="M-20 -34 V-10" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={5} strokeLinecap="round" />
        </g>,
        2,
      );
    case "wizard":
      return at(
        <g>
          <path d="M-34 6 C-20 -10 -10 -50 8 -66 C10 -54 18 -40 30 -36 C16 -30 18 -10 34 6 Z" fill={c1} stroke={c2} strokeWidth={3} {...ink} />
          <ellipse cx={0} cy={6} rx={50} ry={9} fill={c1} stroke={c2} strokeWidth={3} />
          <path d={star(-6, -18, 6)} fill={c3} />
          <path d={star(10, -42, 4)} fill={c3} />
          <circle cx={14} cy={-14} r={2} fill={c3} />
        </g>,
        0,
      );
    case "wreath":
      return at(
        <g>
          <path d="M-46 14 Q0 -10 46 14" fill="none" stroke={c3} strokeWidth={5} strokeLinecap="round" />
          {[-42, -28, -14, 0, 14, 28, 42].map((x, i) => {
            const y = r2(14 - 24 * (1 - (x / 46) ** 2) + 10);
            return (
              <g key={x}>
                <ellipse cx={x + 5} cy={y + 4} rx={6} ry={3} fill={c3} transform={`rotate(30 ${x + 5} ${y + 4})`} />
                {flower(x, y, 4.2, i % 2 ? c2 : c1, i % 2 ? "#ffffff" : "#ffd84d", `w${x}`)}
              </g>
            );
          })}
        </g>,
        -2,
      );
    case "cowboy":
      return at(
        <g>
          <path d="M-58 0 Q-50 14 0 12 Q50 14 58 0 Q52 22 0 22 Q-52 22 -58 0 Z" fill={c1} stroke={c2} strokeWidth={3} {...ink} />
          <path d="M-28 12 C-30 -10 -24 -28 -10 -26 C-4 -18 4 -18 10 -26 C24 -28 30 -10 28 12 Z" fill={c1} stroke={c2} strokeWidth={3} {...ink} />
          <rect x={-28} y={4} width={56} height={6} fill={c2} />
        </g>,
        0,
      );
    case "mortarboard":
      return (
        <g>
          <HeadCap rig={rig} uid={uid} cut={Math.round(top + (rig.brow - top) * 0.5)} fill={c1} line="#000" />
          {at(
            <g>
              <path d="M-56 -2 L0 -18 L56 -2 L0 14 Z" fill={c1} stroke="#000" strokeWidth={2.5} {...ink} />
              <circle cx={0} cy={-2} r={3.5} fill={c2} />
              <path d="M0 -2 L36 2 L38 24" fill="none" stroke={c2} strokeWidth={2.5} {...ink} />
              <path d="M34 22 L38 34 L42 22 Z" fill={c2} />
            </g>,
            0,
          )}
        </g>
      );
    case "headbow":
    case "headbow-dots":
      return (
        <g transform={`translate(${100 + w * 0.3} ${top + (rig.brow - top) * 0.35}) scale(${s}) rotate(18)`}>
          <path d="M0 0 C-10 -14 -26 -12 -24 0 C-26 12 -10 14 0 0 Z" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          <path d="M0 0 C10 -14 26 -12 24 0 C26 12 10 14 0 0 Z" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          {it.art === "headbow-dots" && (
            <g fill={c2}>
              <circle cx={-14} cy={-3} r={2.2} />
              <circle cx={-12} cy={5} r={1.8} />
              <circle cx={14} cy={-3} r={2.2} />
              <circle cx={12} cy={5} r={1.8} />
            </g>
          )}
          <circle cx={0} cy={0} r={5} fill={c1} stroke={c2} strokeWidth={2.5} />
        </g>
      );
    case "headphones": {
      const y = rig.eyes.y - 2;
      const [x1, x2] = [rig.rim[0] - 3, rig.rim[1] + 3];
      return (
        <g>
          <path d={`M${x1 + 4} ${y - 6} C${x1 - 2} ${top - 34} ${x2 + 2} ${top - 34} ${x2 - 4} ${y - 6}`} fill="none" stroke={c3} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${x1 + 4} ${y - 6} C${x1 - 2} ${top - 34} ${x2 + 2} ${top - 34} ${x2 - 4} ${y - 6}`} fill="none" stroke={c1} strokeWidth={5} strokeLinecap="round" />
          {[x1, x2].map((x) => (
            <g key={x}>
              <rect x={x - 9} y={y - 16} width={18} height={30} rx={8} fill={c1} stroke={c3} strokeWidth={2.5} />
              <rect x={x - 5} y={y - 10} width={10} height={18} rx={4} fill={c2} />
            </g>
          ))}
        </g>
      );
    }
    default:
      return null;
  }
}

// --------------------------------------------------------------- glasses --

export function Glasses({ it, rig }: { it: ShopItem; rig: Rig }) {
  const [c1, c2 = c1, c3 = c1] = it.colors;
  const { y, dx, r } = rig.eyes;
  const R = r * 1.45 + 2;
  const xs = [100 - dx, 100 + dx];
  const temples = (
    <path d={`M${xs[0] - R} ${y - 2} L${rig.rim[0] + 2} ${y - 6} M${xs[1] + R} ${y - 2} L${rig.rim[1] - 2} ${y - 6}`} stroke={c1 === "#ffffff" ? "#2a2230" : c1} strokeWidth={3} {...ink} />
  );
  const bridge = <path d={`M${xs[0] + R * 0.9} ${y - 2} Q100 ${y - 8} ${xs[1] - R * 0.9} ${y - 2}`} fill="none" stroke={c1 === "#ffffff" ? "#2a2230" : c1} strokeWidth={3} {...ink} />;
  switch (it.art) {
    case "round":
      return (
        <g>
          {temples}
          {bridge}
          {xs.map((x) => (
            <circle key={x} cx={x} cy={y} r={R} fill="#ffffff" fillOpacity={0.15} stroke={c1} strokeWidth={3} />
          ))}
        </g>
      );
    case "sun":
      return (
        <g>
          {temples}
          {bridge}
          {xs.map((x) => (
            <g key={x}>
              <path d={`M${x - R - 2} ${y - R * 0.75} H${x + R + 2} Q${x + R + 2} ${y + R} ${x} ${y + R} Q${x - R - 2} ${y + R} ${x - R - 2} ${y - R * 0.75} Z`} fill={c1} stroke="#000" strokeWidth={2} {...ink} />
              <path d={`M${x - R * 0.5} ${y - R * 0.3} L${x - R * 0.1} ${y + R * 0.3}`} stroke={c2} strokeWidth={3} strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case "star":
      return (
        <g>
          {temples}
          {bridge}
          {xs.map((x) => (
            <path key={x} d={star(x, y, R + 4, 0.55)} fill={c2} fillOpacity={0.55} stroke={c1} strokeWidth={3} {...ink} />
          ))}
        </g>
      );
    case "heart":
      return (
        <g>
          {temples}
          {bridge}
          {xs.map((x) => (
            <path key={x} d={heart(x, y + 1, (R + 3) / 11)} fill={c2} fillOpacity={0.55} stroke={c1} strokeWidth={3} {...ink} />
          ))}
        </g>
      );
    case "square":
      return (
        <g>
          {temples}
          {bridge}
          {xs.map((x) => (
            <rect key={x} x={x - R - 1} y={y - R * 0.85} width={2 * R + 2} height={R * 1.7} rx={4} fill="#ffffff" fillOpacity={0.15} stroke={c1} strokeWidth={3.5} />
          ))}
        </g>
      );
    case "3d":
      return (
        <g>
          {temples}
          <rect x={xs[0] - R - 4} y={y - R * 0.9} width={xs[1] - xs[0] + 2 * R + 8} height={R * 1.8} rx={5} fill={c1} stroke="#2a2230" strokeWidth={2.5} />
          <rect x={xs[0] - R} y={y - R * 0.6} width={2 * R} height={R * 1.2} rx={3} fill={c2} fillOpacity={0.7} />
          <rect x={xs[1] - R} y={y - R * 0.6} width={2 * R} height={R * 1.2} rx={3} fill={c3} fillOpacity={0.7} />
        </g>
      );
    case "monocle":
      return (
        <g>
          <circle cx={xs[1]} cy={y} r={R + 1} fill="#ffffff" fillOpacity={0.18} stroke={c1} strokeWidth={3} />
          <path d={`M${xs[1] + R * 0.7} ${y + R * 0.7} Q${xs[1] + R + 6} ${y + 26} ${xs[1] + 4} ${y + 40}`} fill="none" stroke={c1} strokeWidth={1.8} strokeDasharray="3 2" />
        </g>
      );
    default:
      return null;
  }
}

// ------------------------------------------------------------ neck, chest --

export function Neckwear({ it, rig }: { it: ShopItem; rig: Rig }) {
  const [c1, c2 = c1] = it.colors;
  const { y, w } = rig.neck;
  switch (it.art) {
    case "scarf":
    case "scarf-stripes": {
      const half = w / 2 + 5;
      const stripes = it.art === "scarf-stripes";
      return (
        <g>
          <path d={`M${100 + w * 0.12} ${y + 2} l-4 30 l16 2 l2 -30 Z`} fill={c1} stroke={stripes ? "#24479a" : c2} strokeWidth={2.5} {...ink} />
          {stripes && <path d={`M${100 + w * 0.12 - 2} ${y + 14} l16 1 M${100 + w * 0.12 - 3} ${y + 24} l16 1`} stroke={c2} strokeWidth={4} />}
          <path d={`M${100 + w * 0.12 - 4} ${y + 32} l2 5 M${100 + w * 0.12 + 2} ${y + 33} l1 5 M${100 + w * 0.12 + 8} ${y + 33} l0 5`} stroke={stripes ? "#24479a" : c2} strokeWidth={2} />
          <rect x={100 - half} y={y - 7} width={2 * half} height={15} rx={7.5} fill={c1} stroke={stripes ? "#24479a" : c2} strokeWidth={2.5} />
          {stripes &&
            Array.from({ length: Math.floor((2 * half) / 12) }, (_, i) => (
              <rect key={i} x={100 - half + 6 + i * 12} y={y - 6} width={5} height={13} fill={c2} />
            ))}
        </g>
      );
    }
    case "bowtie":
    case "bowtie-dots":
      return (
        <g transform={`translate(100 ${y + 2})`}>
          <path d="M0 0 L-16 -9 L-16 9 Z" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          <path d="M0 0 L16 -9 L16 9 Z" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          {it.art === "bowtie-dots" && (
            <g fill={c2}>
              <circle cx={-10} cy={-2} r={1.8} />
              <circle cx={-12} cy={4} r={1.5} />
              <circle cx={10} cy={-2} r={1.8} />
              <circle cx={12} cy={4} r={1.5} />
            </g>
          )}
          <rect x={-4} y={-5} width={8} height={10} rx={3} fill={c1} stroke={c2} strokeWidth={2} />
        </g>
      );
    default:
      return null;
  }
}

export function ChestItem({ it, rig }: { it: ShopItem; rig: Rig }) {
  const [c1, c2 = "#3a6fd8"] = it.colors;
  const x = 100 - rig.neck.w * 0.22;
  const y = rig.neck.y + 20;
  switch (it.art) {
    case "medal":
      return (
        <g>
          <path d={`M${100 - rig.neck.w * 0.3} ${rig.neck.y} L${x} ${y - 8} L${100 + rig.neck.w * 0.1} ${rig.neck.y}`} fill="none" stroke={c2} strokeWidth={4} {...ink} />
          <circle cx={x} cy={y} r={9} fill={c1} stroke="#a7771a" strokeWidth={2.5} />
          <path d={star(x, y, 5)} fill="#fff3bf" />
        </g>
      );
    case "pin-star":
      return <path d={star(x, y - 4, 8)} fill={c1} stroke="#b07a10" strokeWidth={2} {...ink} />;
    case "pin-heart":
      return <path d={heart(x, y - 4, 0.75)} fill={c1} stroke="#c0335b" strokeWidth={2} {...ink} />;
    default:
      return null;
  }
}

// ------------------------------------------------------------------ back --

export function BackItem({ it, rig }: { it: ShopItem; rig: Rig }) {
  const [c1, c2 = c1, c3 = "#ffffff"] = it.colors;
  const [[lx, ly], [rx, ry]] = rig.pauldrons;
  switch (it.art) {
    case "backpack":
      return (
        <g>
          <rect x={lx - 26} y={ly - 22} width={36} height={50} rx={10} fill={c1} stroke={c2} strokeWidth={3} />
          <rect x={rx - 10} y={ry - 22} width={36} height={50} rx={10} fill={c1} stroke={c2} strokeWidth={3} />
          <path d={`M${lx - 16} ${ly - 20} Q100 ${ly - 34} ${rx + 16} ${ry - 20}`} fill="none" stroke={c2} strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    case "cape":
    case "cape-stars":
      return (
        <g>
          <path d={`M${lx} ${ly - 10} L${lx - 30} 210 Q100 222 ${rx + 30} 210 L${rx} ${ry - 10} Z`} fill={c1} stroke={c2} strokeWidth={3} {...ink} />
          {it.art === "cape-stars" && (
            <g fill={c3}>
              <path d={star(lx - 16, 190, 5)} />
              <path d={star(rx + 18, 180, 4)} />
              <path d={star(rx + 10, 204, 3)} />
              <path d={star(lx - 6, 160, 3)} />
            </g>
          )}
        </g>
      );
    case "wings-angel": {
      const wing = (x: number, y: number, flip: 1 | -1) => (
        <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
          <path d="M0 0 C-20 -26 -54 -30 -62 -10 C-52 -10 -48 -4 -56 4 C-44 4 -42 10 -48 18 C-34 16 -26 22 -28 30 C-16 22 -6 14 0 6 Z" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          <path d="M-12 -8 C-28 -14 -40 -12 -48 -6 M-14 4 C-28 4 -36 8 -40 14" fill="none" stroke={c2} strokeWidth={2} />
        </g>
      );
      return (
        <g>
          {wing(lx + 8, ly, 1)}
          {wing(rx - 8, ry, -1)}
        </g>
      );
    }
    case "wings-butterfly": {
      const wing = (x: number, y: number, flip: 1 | -1) => (
        <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
          <path d="M0 0 C-14 -40 -56 -44 -54 -14 C-52 4 -24 6 0 0 Z" fill={c1} stroke={c2} strokeWidth={2.5} {...ink} />
          <path d="M0 4 C-24 6 -44 18 -36 36 C-26 46 -8 30 0 10 Z" fill={c2} fillOpacity={0.85} stroke={c2} strokeWidth={2.5} {...ink} />
          <circle cx={-32} cy={-18} r={6} fill={c3} />
          <circle cx={-22} cy={26} r={4} fill={c3} />
        </g>
      );
      return (
        <g>
          {wing(lx + 10, ly + 4, 1)}
          {wing(rx - 10, ry + 4, -1)}
        </g>
      );
    }
    default:
      return null;
  }
}

/** Straps and clasps that show in front of the body. */
export function BackItemFront({ it, rig }: { it: ShopItem; rig: Rig }) {
  const [c1, c2 = c1] = it.colors;
  const [[lx, ly], [rx, ry]] = rig.pauldrons;
  if (it.art === "backpack") {
    return (
      <g stroke={c2} strokeWidth={5} strokeLinecap="round" fill="none">
        <path d={`M${lx + 4} ${ly - 8} Q${lx + 8} ${ly + 16} ${lx + 6} ${ly + 36}`} />
        <path d={`M${rx - 4} ${ry - 8} Q${rx - 8} ${ry + 16} ${rx - 6} ${ry + 36}`} />
      </g>
    );
  }
  if (it.art === "cape" || it.art === "cape-stars") {
    return (
      <g>
        <path d={`M${lx + 2} ${ly - 8} Q100 ${rig.neck.y + 8} ${rx - 2} ${ry - 8}`} fill="none" stroke={c1} strokeWidth={5} strokeLinecap="round" />
        <circle cx={100} cy={rig.neck.y + 4} r={5} fill="#f2c14e" stroke="#a7771a" strokeWidth={2} />
      </g>
    );
  }
  return null;
}

// ------------------------------------------------------------------ hand --

/** A held item with its grip at the origin, pointing up. */
export function HandItem({ it }: { it: ShopItem }) {
  const [c1, c2 = c1] = it.colors;
  switch (it.art) {
    case "wand":
      return (
        <g>
          <rect x={-3} y={-46} width={6} height={58} rx={3} fill={c1} />
          <rect x={-3} y={-46} width={6} height={10} rx={3} fill="#ffffff" />
          <path d={star(0, -56, 12)} fill={c2} stroke="#b07a10" strokeWidth={2} {...ink} />
          <circle cx={14} cy={-66} r={2} fill={c2} className="hero-glow" />
          <circle cx={-12} cy={-70} r={1.6} fill={c2} className="hero-glow" />
        </g>
      );
    case "flag":
      return (
        <g>
          <rect x={-2.5} y={-62} width={5} height={74} rx={2.5} fill="#8a5a33" />
          <path d="M2 -60 L40 -52 L2 -40 Z" fill={c1} stroke="#1f5a38" strokeWidth={2} {...ink} />
          <circle cx={0} cy={-63} r={3.5} fill="#f2c14e" />
        </g>
      );
    case "icecream":
      return (
        <g>
          <path d="M-10 -16 L0 10 L10 -16 Z" fill={c2} stroke="#8a5a2b" strokeWidth={2} {...ink} />
          <path d="M-7 -12 L5 -4 M-3 -15 L7 -10" stroke="#8a5a2b" strokeWidth={1.2} />
          <circle cx={0} cy={-22} r={11} fill={c1} stroke="#e07a98" strokeWidth={2} />
          <circle cx={0} cy={-35} r={3.5} fill="#e2453c" />
        </g>
      );
    case "book":
      return (
        <g transform="rotate(-22)">
          <rect x={-14} y={-38} width={28} height={36} rx={3} fill={c1} stroke="#24479a" strokeWidth={2.5} />
          <rect x={-10} y={-34} width={22} height={28} rx={2} fill={c2} opacity={0.25} />
          <path d="M-6 -28 H8 M-6 -22 H8" stroke={c2} strokeWidth={2} />
        </g>
      );
    case "balloon":
      return (
        <g transform="rotate(-22)">
          <path d="M0 0 C6 -20 -6 -40 0 -62" fill="none" stroke="#6b6b6b" strokeWidth={1.5} />
          <ellipse cx={0} cy={-80} rx={16} ry={19} fill={c1} stroke="#c0335b" strokeWidth={2} />
          <path d="M-3 -61 L3 -61 L0 -57 Z" fill="#c0335b" />
          <ellipse cx={-6} cy={-86} rx={4} ry={6} fill="#ffffff" opacity={0.5} />
        </g>
      );
    case "pencil":
      return (
        <g>
          <rect x={-5} y={-50} width={10} height={58} fill={c1} stroke="#b07a10" strokeWidth={1.8} />
          <rect x={-5} y={4} width={10} height={8} rx={2} fill={c2} />
          <path d="M-5 -50 L0 -64 L5 -50 Z" fill="#f3d9b0" stroke="#b07a10" strokeWidth={1.8} {...ink} />
          <path d="M-1.6 -59 L0 -64 L1.6 -59 Z" fill="#2a2230" />
        </g>
      );
    case "lollipop":
      return (
        <g>
          <rect x={-2} y={-34} width={4} height={46} rx={2} fill="#ffffff" stroke="#c9c9c9" strokeWidth={1} />
          <circle cx={0} cy={-46} r={14} fill={c1} stroke="#c0335b" strokeWidth={2} />
          <path d="M0 -46 m-8 0 a8 8 0 1 1 8 8 a5 5 0 1 1 -5 -5" fill="none" stroke={c2} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

// ------------------------------------------------------ colours, patterns --

/** Gradient fills for the special colourways; other colourways are plain palettes. */
export function ColorDefs({ it, uid }: { it: ShopItem; uid: string }) {
  if (it.art === "rainbow") {
    return (
      <linearGradient id={`${uid}-col`} gradientUnits="userSpaceOnUse" x1="30" y1="20" x2="170" y2="210">
        {it.colors.map((c, i) => (
          <stop key={c} offset={i / (it.colors.length - 1)} stopColor={c} />
        ))}
      </linearGradient>
    );
  }
  if (it.art === "galaxy") {
    return (
      <linearGradient id={`${uid}-col`} gradientUnits="userSpaceOnUse" x1="40" y1="20" x2="160" y2="210">
        <stop offset="0" stopColor="#4b3bb0" />
        <stop offset="0.5" stopColor={it.colors[0]} />
        <stop offset="1" stopColor={it.colors[3]} />
      </linearGradient>
    );
  }
  return null;
}

export function colorway(it: ShopItem, uid: string): { main: string; shade: string; light: string } {
  if (it.art === "rainbow") return { main: `url(#${uid}-col)`, shade: "#6b4fb8", light: "#fff6fb" };
  if (it.art === "galaxy") return { main: `url(#${uid}-col)`, shade: it.colors[1], light: it.colors[2] };
  return { main: it.colors[0], shade: it.colors[1], light: it.colors[2] };
}

export function PatternDefs({ it, uid }: { it: ShopItem; uid: string }) {
  const c = it.colors[0];
  const id = `${uid}-pat`;
  switch (it.art) {
    case "dots":
      return (
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="3" fill={c} />
          <circle cx="12" cy="12" r="3" fill={c} />
        </pattern>
      );
    case "stripes":
      return (
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="14" fill={c} />
        </pattern>
      );
    case "stars":
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <path d={star(6, 6, 4.5)} fill={c} />
          <path d={star(17, 16, 3)} fill={c} />
        </pattern>
      );
    case "hearts":
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <path d={heart(6, 7, 0.35)} fill={c} />
          <path d={heart(17, 17, 0.3)} fill={c} />
        </pattern>
      );
    case "zigzag":
      return (
        <pattern id={id} width="16" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 8 L4 2 L8 8 L12 2 L16 8" fill="none" stroke={c} strokeWidth="2.5" />
        </pattern>
      );
    default:
      return null;
  }
}

// --------------------------------------------- backgrounds, frames, effects --

const BOX = { x: -16, y: -28, w: 232, h: 250 };

export function Background({ it }: { it: ShopItem }) {
  const [c1, c2] = it.colors;
  const { x, y, w, h } = BOX;
  const base = <rect x={x} y={y} width={w} height={h} fill={c1} />;
  const ground = (color: string, at = 200) => <rect x={x} y={at} width={w} height={y + h - at} fill={color} />;
  switch (it.art) {
    case "space":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={c1} />
          <circle cx={30} cy={20} r={70} fill={c2} opacity={0.5} />
          {[
            [10, 10], [60, -10], [150, 20], [190, 60], [20, 120], [180, 150], [120, -15], [40, 60],
          ].map(([sx, sy], i) => (
            <path key={i} d={star(sx, sy, i % 2 ? 2.5 : 4, 0.4, 4)} fill="#ffffff" opacity={0.85} />
          ))}
          <circle cx={170} cy={10} r={16} fill="#f2c14e" />
          <circle cx={176} cy={6} r={16} fill={c1} />
          {ground("#3b3f6b")}
        </g>
      );
    case "forest":
      return (
        <g>
          {base}
          {[[-6, 150, 26], [30, 160, 20], [170, 150, 28], [205, 165, 20]].map(([tx, ty, r], i) => (
            <g key={i}>
              <rect x={tx - 4} y={ty} width={8} height={50} fill="#8a5a33" />
              <circle cx={tx} cy={ty - 8} r={r} fill={c2} />
              <circle cx={tx + r * 0.4} cy={ty - r * 0.6} r={r * 0.7} fill="#7cc046" />
            </g>
          ))}
          {ground("#9fd45a")}
        </g>
      );
    case "beach":
      return (
        <g>
          {base}
          <circle cx={170} cy={10} r={20} fill="#ffd84d" />
          <rect x={x} y={160} width={w} height={40} fill="#5ec8f2" />
          <path d={`M${x} 165 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0`} fill="none" stroke="#ffffff" strokeWidth={3} />
          {ground(c2, 196)}
        </g>
      );
    case "city":
      return (
        <g>
          {base}
          {[[-16, 110, 40], [24, 80, 34], [150, 90, 36], [186, 120, 30]].map(([bx, by, bw], i) => (
            <g key={i}>
              <rect x={bx} y={by} width={bw} height={200 - by} fill={c2} opacity={0.85} />
              {Array.from({ length: 4 }, (_, k) => (
                <rect key={k} x={bx + 6 + (k % 2) * (bw / 2 - 2)} y={by + 10 + Math.floor(k / 2) * 18} width={8} height={10} fill="#ffe9a6" />
              ))}
            </g>
          ))}
          {ground("#b9b2c9")}
        </g>
      );
    case "library":
      return (
        <g>
          {base}
          {[20, 70, 120].map((sy) => (
            <g key={sy}>
              <rect x={x} y={sy + 30} width={w} height={6} fill={c2} />
              {Array.from({ length: 16 }, (_, k) => (
                <rect key={k} x={x + 4 + k * 14} y={sy + 6 + (k % 3) * 3} width={10} height={24 - (k % 3) * 3} fill={["#e2453c", "#3a6fd8", "#2e7d4f", "#f2c14e"][k % 4]} opacity={0.75} />
              ))}
            </g>
          ))}
          {ground("#c9a77a", 196)}
        </g>
      );
    case "mountains":
      return (
        <g>
          {base}
          <path d="M-16 200 L40 90 L90 200 Z" fill={c2} />
          <path d="M60 200 L130 60 L216 200 Z" fill="#5f7394" />
          <path d="M130 60 L114 92 L124 88 L132 96 L140 86 L146 92 Z" fill="#ffffff" />
          <path d="M40 90 L28 114 L38 110 L46 116 L52 112 Z" fill="#ffffff" />
          {ground("#9fbf7a")}
        </g>
      );
    case "sunset":
      return (
        <g>
          <defs>
            <linearGradient id="sunset-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c2} />
              <stop offset="1" stopColor={c1} />
            </linearGradient>
          </defs>
          <rect x={x} y={y} width={w} height={h} fill="url(#sunset-sky)" />
          <circle cx={100} cy={170} r={44} fill="#ffe08a" opacity={0.9} />
          {ground("#7a4b6b", 192)}
        </g>
      );
    case "underwater":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={c1} />
          <rect x={x} y={90} width={w} height={h} fill={c2} opacity={0.35} />
          {[[20, 40, 6], [180, 80, 8], [30, 140, 5], [170, 20, 4]].map(([bx, by, r], i) => (
            <circle key={i} cx={bx} cy={by} r={r} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.7} />
          ))}
          <path d="M0 200 C4 170 -6 150 4 120 M14 200 C20 176 10 160 18 140 M190 200 C186 170 196 150 188 126" fill="none" stroke="#2f9e62" strokeWidth={5} strokeLinecap="round" />
          {ground("#e8d39a", 198)}
        </g>
      );
    default:
      return null;
  }
}

export function Frame({ it }: { it: ShopItem }) {
  const [c1, c2 = c1, c3 = c2] = it.colors;
  const { x, y, w, h } = BOX;
  const rect = (inset: number, stroke: string, width: number, extra?: object) => (
    <rect x={x + inset} y={y + inset} width={w - 2 * inset} height={h - 2 * inset} rx={18} fill="none" stroke={stroke} strokeWidth={width} {...extra} />
  );
  const corners: Pt[] = [
    [x + 10, y + 10],
    [x + w - 10, y + 10],
    [x + 10, y + h - 10],
    [x + w - 10, y + h - 10],
  ];
  switch (it.art) {
    case "frame":
      return (
        <g>
          {rect(4, c2, 9)}
          {rect(4, c1, 5)}
          {corners.map(([cx, cy]) => (
            <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={6} fill={c1} stroke={c2} strokeWidth={2} />
          ))}
        </g>
      );
    case "frame-neon":
      return (
        <g>
          {rect(5, c1, 8, { opacity: 0.35 })}
          {rect(5, c1, 3)}
          {rect(11, c2, 2.5)}
        </g>
      );
    case "frame-flowers":
      return (
        <g>
          {rect(5, c1, 4)}
          {corners.map(([cx, cy], i) => flower(cx, cy, 6, i % 2 ? c2 : c3, "#ffffff", `c${i}`))}
          {flower(100, y + 6, 5, c2, "#ffffff", "top")}
          {flower(100, y + h - 6, 5, c3, "#ffffff", "bottom")}
        </g>
      );
    case "frame-stars":
      return (
        <g>
          {rect(5, c1, 5)}
          {corners.map(([cx, cy]) => (
            <path key={`${cx}${cy}`} d={star(cx, cy, 9)} fill={c2} stroke={c1} strokeWidth={1.5} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Shown around a winner. Purely decorative. */
export function VictoryEffect({ it }: { it: ShopItem }) {
  const colors = it.colors;
  switch (it.art) {
    case "confetti":
      return (
        <g>
          {Array.from({ length: 22 }, (_, i) => {
            const cx = -6 + ((i * 47) % 212);
            const cy = -20 + ((i * 29) % 90);
            return (
              <rect
                key={i}
                className="hero-confetti"
                style={{ animationDelay: `${(i % 7) * 140}ms` }}
                x={cx}
                y={cy}
                width={6}
                height={10}
                rx={1.5}
                fill={colors[i % colors.length]}
                transform={`rotate(${(i * 37) % 180} ${cx + 3} ${cy + 5})`}
              />
            );
          })}
        </g>
      );
    case "fireworks":
      return (
        <g>
          {[
            [26, 10, 0],
            [176, 0, 1],
            [100, -16, 2],
          ].map(([fx, fy, k]) => (
            <g key={k} className="hero-burst" style={{ animationDelay: `${k * 300}ms`, transformOrigin: `${fx}px ${fy}px` }}>
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return (
                  <path
                    key={i}
                    d={`M${r2(fx + Math.cos(a) * 6)} ${r2(fy + Math.sin(a) * 6)} L${r2(fx + Math.cos(a) * 20)} ${r2(fy + Math.sin(a) * 20)}`}
                    stroke={colors[(i + k) % colors.length]}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          ))}
        </g>
      );
    case "hearts":
      return (
        <g>
          {[
            [20, 60, 1],
            [180, 40, 0.8],
            [10, 130, 0.7],
            [190, 120, 1],
            [60, -6, 0.6],
            [150, -10, 0.7],
          ].map(([hx, hy, s], i) => (
            <path key={i} className="hero-sparkle" style={{ animationDelay: `${i * 180}ms` }} d={heart(hx, hy, s)} fill={colors[i % colors.length]} />
          ))}
        </g>
      );
    case "rainbow":
      return (
        <g opacity={0.85}>
          {colors.map((c, i) => (
            <path key={c} d={`M${-6 + i * 8} 150 A${106 - i * 8} 120 0 0 1 ${206 - i * 8} 150`} fill="none" stroke={c} strokeWidth={8} />
          ))}
        </g>
      );
    case "bubbles":
      return (
        <g>
          {[
            [16, 160, 8],
            [184, 150, 10],
            [28, 90, 6],
            [176, 70, 7],
            [60, 20, 5],
            [150, 10, 6],
          ].map(([bx, by, r], i) => (
            <circle key={i} className="hero-bubble" style={{ animationDelay: `${i * 220}ms` }} cx={bx} cy={by} r={r} fill={colors[0]} fillOpacity={0.4} stroke={colors[1]} strokeWidth={2} />
          ))}
        </g>
      );
    default:
      return null;
  }
}
