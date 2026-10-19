/**
 * The fourteen heroes, drawn as layered SVG in one shared 200×212 frame (feet
 * on y = 212). Each species also describes its rig — the top of its head,
 * brow, eyes, neck line, shoulders and both hands — so accessories and faces
 * fit every shape: hats sit on the crown, glasses on the eyes, scarves on the
 * neck line below the mouth, and held items in a paw, wing, fin, claw,
 * branch or pseudopod.
 */

import type { ReactNode } from "react";

import type { Palette, SpeciesId } from "@/lib/arena-rules";

type Pt = [number, number];

export interface Rig {
  /** Head silhouette (the whole body for one-piece heroes): caps and beanies are cut from it. */
  head: string;
  headCenter: Pt;
  /** Highest point of the head, where hats sit. */
  top: number;
  /** Lowest line a hat may reach; always above the eyes. */
  brow: number;
  /** Head width at the brow, from x to x. */
  rim: Pt;
  body: string;
  /** Band of the body below the mouth (used for patterns and chest items). */
  armor: Pt;
  /** Shoulder points: backpack straps, cape and wings start here. */
  pauldrons: [Pt, Pt];
  /** Neck line below the mouth: scarves and bow ties. */
  neck: { y: number; w: number };
  /** The free hand, for a balloon string or nothing. */
  offHand: Pt;
  eyes: { y: number; dx: number; r: number; lid: string; ink?: string; base?: string };
  mouth: { x: number; y: number; s: number; kind?: "beak" | "led"; teeth?: boolean };
  shoulder: Pt;
  hand: Pt;
  /** Top of the head-and-shoulders crop. */
  bustTop: number;
}

export interface Parts {
  rig: Rig;
  /** Behind everything: tails, wings, ears, horns, antennae, fins, flowers. */
  behind: ReactNode;
  body: ReactNode;
  offArm: ReactNode;
  /** Head outline and head details below the helmet (muzzle, patches, lop ears). */
  head: ReactNode;
  /** The arm that holds items, without the hand. */
  arm: ReactNode;
  /** The hand, drawn over a held item. */
  hand: ReactNode;
}

const ol = (color: string, width = 3) => ({ stroke: color, strokeWidth: width, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });

export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
}

function mirror(d: string): string {
  // Mirrors absolute path coordinates around x = 100 (pairs of numbers after commands).
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`);
}

function Limb({ from, to, fill, line, w = 15 }: { from: Pt; to: Pt; fill: string; line: string; w?: number }) {
  const d = `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;
  return (
    <g>
      <path d={d} stroke={line} strokeWidth={w + 6} strokeLinecap="round" fill="none" />
      <path d={d} stroke={fill} strokeWidth={w} strokeLinecap="round" fill="none" />
    </g>
  );
}

function Paw({ at, fill, line, r = 9 }: { at: Pt; fill: string; line: string; r?: number }) {
  return <circle cx={at[0]} cy={at[1]} r={r} fill={fill} {...ol(line)} />;
}

function Feet({ y = 205, dx = 20, fill, line, rx = 17, ry = 9 }: { y?: number; dx?: number; fill: string; line: string; rx?: number; ry?: number }) {
  return (
    <g>
      <ellipse cx={100 - dx} cy={y} rx={rx} ry={ry} fill={fill} {...ol(line)} />
      <ellipse cx={100 + dx} cy={y} rx={rx} ry={ry} fill={fill} {...ol(line)} />
    </g>
  );
}

// ------------------------------------------------- the standard chibi frame --

const HEAD = ellipse(100, 84, 56, 49);
const BODY = "M100 122 C128 122 140 146 140 170 C140 196 124 206 100 206 C76 206 60 196 60 170 C60 146 72 122 100 122 Z";

function standardRig(pal: Palette, over: Partial<Rig> = {}): Rig {
  return {
    head: HEAD,
    headCenter: [100, 84],
    top: 35,
    brow: 64,
    rim: [44, 156],
    body: BODY,
    armor: [146, 192],
    pauldrons: [
      [66, 146],
      [134, 146],
    ],
    eyes: { y: 89, dx: 22, r: 9, lid: pal.main },
    mouth: { x: 100, y: 113, s: 1 },
    shoulder: [134, 148],
    hand: [156, 164],
    neck: { y: 131, w: 62 },
    offHand: [46, 170],
    bustTop: 6,
    ...over,
  };
}

function standardBody(pal: Palette, belly = true, extra?: ReactNode): ReactNode {
  return (
    <g>
      <path d={BODY} fill={pal.main} {...ol(pal.shade)} />
      {belly && <ellipse cx={100} cy={176} rx={24} ry={21} fill={pal.light} />}
      {extra}
      <Feet fill={pal.main} line={pal.shade} />
    </g>
  );
}

const OFF_SHOULDER: Pt = [66, 148];
const OFF_HAND: Pt = [46, 170];

function standardArms(pal: Palette, rig: Rig, color = pal.main) {
  return {
    offArm: (
      <g>
        <Limb from={OFF_SHOULDER} to={OFF_HAND} fill={color} line={pal.shade} />
        <Paw at={OFF_HAND} fill={color} line={pal.shade} />
      </g>
    ),
    arm: <Limb from={rig.shoulder} to={rig.hand} fill={color} line={pal.shade} />,
    hand: <Paw at={rig.hand} fill={color} line={pal.shade} />,
  };
}

// ------------------------------------------------------------------- cat --

function cat(pal: Palette, ft: Record<string, string>): Parts {
  const rig = standardRig(pal);
  const ear = (d: string, inner: string) => (
    <g>
      <path d={d} fill={pal.main} {...ol(pal.shade)} />
      <path d={inner} fill={pal.accent} opacity={0.75} />
    </g>
  );
  const ears =
    ft.ears === "folded" ? (
      <g>
        {ear("M48 66 C40 40 46 20 64 18 C78 18 86 30 84 44 Z", "M56 52 C52 38 56 28 66 27 C74 28 77 36 75 44 Z")}
        {ear(mirror("M48 66 C40 40 46 20 64 18 C78 18 86 30 84 44 Z"), mirror("M56 52 C52 38 56 28 66 27 C74 28 77 36 75 44 Z"))}
        <path d="M50 28 C58 34 66 30 70 22" fill="none" {...ol(pal.shade, 2.5)} />
        <path d={mirror("M50 28 C58 34 66 30 70 22")} fill="none" {...ol(pal.shade, 2.5)} />
      </g>
    ) : (
      <g>
        {ear("M48 70 L54 14 L92 44 Z", "M58 56 L60 28 L82 46 Z")}
        {ear(mirror("M48 70 L54 14 L92 44 Z"), mirror("M58 56 L60 28 L82 46 Z"))}
        {ft.ears === "lynx" && (
          <g {...ol(pal.shade, 3)}>
            <path d="M54 16 L50 -2" />
            <path d="M146 16 L150 -2" />
          </g>
        )}
      </g>
    );
  const stripes = ft.pattern === "stripes";
  return {
    rig,
    behind: (
      <g>
        <g className="hero-tail" style={{ transformOrigin: "70px 192px" }}>
          <path d="M70 192 C34 198 22 164 34 136" fill="none" stroke={pal.shade} strokeWidth={19} strokeLinecap="round" />
          <path d="M70 192 C34 198 22 164 34 136" fill="none" stroke={pal.main} strokeWidth={13} strokeLinecap="round" />
          {stripes && <path d="M30 160 l10 -3 M28 148 l10 -1 M42 184 l6 -8" {...ol(pal.shade, 3)} />}
        </g>
        {ears}
      </g>
    ),
    body: standardBody(
      pal,
      true,
      stripes ? <path d="M66 160 l12 4 M64 172 l12 2 M134 160 l-12 4 M136 172 l-12 2" {...ol(pal.shade, 3)} /> : null,
    ),
    ...standardArms(pal, rig),
    head: (
      <g>
        <path d={HEAD} fill={pal.main} {...ol(pal.shade)} />
        {ft.pattern === "mask" && <path d="M66 112 C66 92 84 86 100 98 C116 86 134 92 134 112 C130 128 114 132 100 132 C86 132 70 128 66 112 Z" fill={pal.light} />}
        {stripes && <path d="M48 92 l12 2 M48 102 l12 0 M152 92 l-12 2 M152 102 l-12 0" {...ol(pal.shade, 3)} />}
        <path d="M95 101 L105 101 L100 106.5 Z" fill={pal.accent} {...ol(pal.shade, 1.5)} />
        <g {...ol(pal.shade, 1.8)} opacity={0.75}>
          <path d="M76 104 L56 100 M76 109 L56 111" />
          <path d="M124 104 L144 100 M124 109 L144 111" />
        </g>
      </g>
    ),
  };
}

// ------------------------------------------------------------------- fox --

const FOX_HEAD = "M44 84 C44 50 70 35 100 35 C130 35 156 50 156 84 C156 98 168 110 160 118 C150 128 128 134 100 134 C72 134 50 128 40 118 C32 110 44 98 44 84 Z";

function fox(pal: Palette, ft: Record<string, string>): Parts {
  const rig = standardRig(pal, { head: FOX_HEAD, mouth: { x: 100, y: 118, s: 1 } });
  const big = ft.ears === "fennec";
  const earL = big ? "M54 70 L30 -6 L96 42 Z" : "M52 66 L50 10 L92 42 Z";
  const innerL = big ? "M58 56 L42 12 L84 44 Z" : "M58 54 L57 24 L82 44 Z";
  const tail = (
    <g>
      <path d="M72 188 C30 198 8 164 20 128 C28 108 46 116 48 134 C50 154 60 168 80 170 Z" fill={pal.main} {...ol(pal.shade)} />
      <path d="M20 128 C26 112 42 112 47 128 C42 136 28 138 20 128 Z" fill={pal.light} {...ol(pal.shade, 2)} />
    </g>
  );
  return {
    rig,
    behind: (
      <g>
        <g className="hero-tail" style={{ transformOrigin: "74px 184px" }}>
          {ft.tail === "twin" && <g transform="rotate(-24 74 184)">{tail}</g>}
          {tail}
        </g>
        <path d={earL} fill={pal.main} {...ol(pal.shade)} />
        <path d={innerL} fill={big ? pal.light : pal.accent} opacity={0.85} />
        <path d={mirror(earL)} fill={pal.main} {...ol(pal.shade)} />
        <path d={mirror(innerL)} fill={big ? pal.light : pal.accent} opacity={0.85} />
      </g>
    ),
    body: (
      <g>
        <path d={BODY} fill={pal.main} {...ol(pal.shade)} />
        <path d="M84 128 C92 140 108 140 116 128 C126 150 120 190 100 196 C80 190 74 150 84 128 Z" fill={pal.light} />
        <Feet fill={pal.accent} line={pal.shade} />
      </g>
    ),
    ...standardArms(pal, rig),
    hand: <Paw at={rig.hand} fill={pal.accent} line={pal.shade} />,
    offArm: (
      <g>
        <Limb from={OFF_SHOULDER} to={OFF_HAND} fill={pal.main} line={pal.shade} />
        <Paw at={OFF_HAND} fill={pal.accent} line={pal.shade} />
      </g>
    ),
    head: (
      <g>
        <path d={FOX_HEAD} fill={pal.main} {...ol(pal.shade)} />
        <path d="M46 112 C60 100 82 102 100 112 C118 102 140 100 154 112 C142 126 122 133 100 133 C78 133 58 126 46 112 Z" fill={pal.light} />
        <ellipse cx={100} cy={109} rx={6.5} ry={4.8} fill={pal.accent} />
      </g>
    ),
  };
}

// ----------------------------------------------------------------- panda --

function heart(cx: number, cy: number, s: number): string {
  return `M${cx} ${cy + 10 * s} C${cx - 16 * s} ${cy} ${cx - 14 * s} ${cy - 14 * s} ${cx - 5 * s} ${cy - 13 * s} C${cx - 2 * s} ${cy - 13 * s} ${cx} ${cy - 10 * s} ${cx} ${cy - 8 * s} C${cx} ${cy - 10 * s} ${cx + 2 * s} ${cy - 13 * s} ${cx + 5 * s} ${cy - 13 * s} C${cx + 14 * s} ${cy - 14 * s} ${cx + 16 * s} ${cy} ${cx} ${cy + 10 * s} Z`;
}

function panda(pal: Palette, ft: Record<string, string>): Parts {
  const rig = standardRig(pal, { eyes: { y: 89, dx: 22, r: 8, lid: pal.accent, base: "#ffffff" } });
  const r = ft.ears === "small" ? 12 : 17;
  const patch = (x: number, flip: number) =>
    ft.patches === "round" ? (
      <circle cx={x} cy={90} r={15} fill={pal.accent} />
    ) : ft.patches === "heart" ? (
      <path d={heart(x, 92, 1.25)} fill={pal.accent} />
    ) : (
      <ellipse cx={x} cy={92} rx={13} ry={17} transform={`rotate(${flip * 28} ${x} 92)`} fill={pal.accent} />
    );
  return {
    rig,
    behind: (
      <g>
        <circle cx={58} cy={44} r={r} fill={pal.accent} />
        <circle cx={142} cy={44} r={r} fill={pal.accent} />
      </g>
    ),
    body: (
      <g>
        <path d={BODY} fill={pal.main} {...ol(pal.shade)} />
        <path d="M62 158 C62 134 80 122 100 122 C120 122 138 134 138 158 C124 148 76 148 62 158 Z" fill={pal.accent} />
        <Feet fill={pal.accent} line={pal.accent} />
      </g>
    ),
    ...standardArms(pal, rig, pal.accent),
    head: (
      <g>
        <path d={HEAD} fill={pal.main} {...ol(pal.shade)} />
        {patch(78, 1)}
        {patch(122, -1)}
        <ellipse cx={100} cy={104} rx={7} ry={5} fill={pal.accent} />
      </g>
    ),
  };
}

// ------------------------------------------------------------------ bear --

function bear(pal: Palette, ft: Record<string, string>): Parts {
  const rig = standardRig(pal, { mouth: { x: 100, y: 114, s: 0.9 } });
  const r = ft.ears === "small" ? 12 : 17;
  return {
    rig,
    behind: (
      <g>
        {[56, 144].map((x) => (
          <g key={x}>
            <circle cx={x} cy={44} r={r} fill={pal.main} {...ol(pal.shade)} />
            <circle cx={x} cy={44} r={r * 0.55} fill={pal.light} />
          </g>
        ))}
      </g>
    ),
    body: standardBody(
      pal,
      ft.pattern === "belly",
      ft.pattern === "moon" ? <path d="M88 154 C92 170 112 172 118 160 C110 164 98 162 94 152 Z" fill={pal.light} {...ol(pal.light, 2)} /> : null,
    ),
    ...standardArms(pal, rig),
    head: (
      <g>
        <path d={HEAD} fill={pal.main} {...ol(pal.shade)} />
        <ellipse cx={100} cy={109} rx={23} ry={16} fill={pal.light} />
        <ellipse cx={100} cy={102} rx={7.5} ry={5.5} fill={pal.accent} />
      </g>
    ),
  };
}

// ---------------------------------------------------------------- rabbit --

function rabbit(pal: Palette, ft: Record<string, string>): Parts {
  const rig = standardRig(pal, { mouth: { x: 100, y: 111, s: 0.9 } });
  const upEar = (cx: number, tilt: number) => (
    <g transform={`rotate(${tilt} ${cx} 44)`}>
      <ellipse cx={cx} cy={10} rx={13} ry={36} fill={pal.main} {...ol(pal.shade)} />
      <ellipse cx={cx} cy={14} rx={6.5} ry={25} fill={pal.accent} opacity={0.8} />
    </g>
  );
  const lopEar = (cx: number, tilt: number) => (
    <g transform={`rotate(${tilt} ${cx} 100)`}>
      <ellipse cx={cx} cy={102} rx={13} ry={33} fill={pal.main} {...ol(pal.shade)} />
      <ellipse cx={cx} cy={106} rx={6} ry={23} fill={pal.accent} opacity={0.8} />
    </g>
  );
  const ears = ft.ears ?? "up";
  return {
    rig,
    behind: (
      <g>
        <circle cx={60} cy={192} r={12} fill={pal.light} {...ol(pal.shade)} />
        {ears !== "lop" && upEar(76, -8)}
        {ears === "up" && upEar(124, 8)}
      </g>
    ),
    body: standardBody(pal, true, ft.pattern === "spots" ? <g fill={pal.light}><circle cx={74} cy={150} r={5} /><circle cx={128} cy={160} r={4} /></g> : null),
    ...standardArms(pal, rig),
    head: (
      <g>
        <path d={HEAD} fill={pal.main} {...ol(pal.shade)} />
        {ears === "lop" && lopEar(44, 16)}
        {ears !== "up" && lopEar(156, -16)}
        {ft.pattern === "blush" && (
          <g fill={pal.accent} opacity={0.55}>
            <ellipse cx={66} cy={106} rx={9} ry={5} />
            <ellipse cx={134} cy={106} rx={9} ry={5} />
          </g>
        )}
        {ft.pattern === "spots" && <circle cx={136} cy={100} r={6} fill={pal.light} />}
        <path d="M95 100 L105 100 L100 105 Z" fill={pal.accent} {...ol(pal.shade, 1.5)} />
      </g>
    ),
  };
}

// ------------------------------------------------------------------- owl --

const OWL = "M100 30 C148 30 162 80 160 126 C158 176 136 206 100 206 C64 206 42 176 40 126 C38 80 52 30 100 30 Z";

function owl(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: OWL,
    headCenter: [100, 118],
    top: 30,
    brow: 60,
    rim: [46, 154],
    body: OWL,
    armor: [138, 190],
    pauldrons: [
      [52, 136],
      [148, 136],
    ],
    eyes: { y: 89, dx: 22, r: 10, lid: pal.light },
    mouth: { x: 100, y: 110, s: 1, kind: "beak" },
    shoulder: [150, 128],
    hand: [168, 156],
    neck: { y: 128, w: 96 },
    offHand: [40, 178],
    bustTop: 6,
  };
  const pattern =
    ft.pattern === "scallop" ? (
      <g fill="none" {...ol(pal.shade, 2)} opacity={0.6}>
        {[150, 164, 178].map((y, row) =>
          [-1, 0, 1].map((k) => <path key={`${y}${k}`} d={`M${100 + k * 16 - 7 + (row % 2) * 8} ${y} q7 7 14 0`} />),
        )}
      </g>
    ) : ft.pattern === "dots" ? (
      <g fill={pal.shade} opacity={0.5}>
        {[
          [86, 150],
          [114, 152],
          [100, 168],
          [82, 182],
          [118, 182],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={3} />
        ))}
      </g>
    ) : null;
  return {
    rig,
    behind: (
      <g>
        {ft.tufts !== "none" && (
          <g>
            <path d="M58 52 L44 10 L84 36 Z" fill={pal.main} {...ol(pal.shade)} />
            <path d={mirror("M58 52 L44 10 L84 36 Z")} fill={pal.main} {...ol(pal.shade)} />
          </g>
        )}
      </g>
    ),
    body: (
      <g>
        <path d={OWL} fill={pal.main} {...ol(pal.shade)} />
        <ellipse cx={100} cy={164} rx={40} ry={38} fill={pal.light} />
        {pattern}
        <g fill={pal.accent} {...ol(pal.shade, 2)}>
          {[84, 116].map((x) => (
            <g key={x}>
              <ellipse cx={x - 6} cy={207} rx={4.5} ry={6} />
              <ellipse cx={x} cy={208} rx={4.5} ry={6} />
              <ellipse cx={x + 6} cy={207} rx={4.5} ry={6} />
            </g>
          ))}
        </g>
      </g>
    ),
    offArm: <path d="M48 112 C26 128 22 166 38 190 C48 172 56 150 58 126 Z" fill={pal.main} {...ol(pal.shade)} />,
    head: (
      <g>
        <circle cx={78} cy={89} r={23} fill={pal.light} {...ol(pal.shade, 2)} />
        <circle cx={122} cy={89} r={23} fill={pal.light} {...ol(pal.shade, 2)} />
      </g>
    ),
    arm: <Limb from={rig.shoulder} to={rig.hand} fill={pal.main} line={pal.shade} w={16} />,
    hand: (
      <g>
        <ellipse cx={rig.hand[0]} cy={rig.hand[1]} rx={10} ry={8} fill={pal.main} {...ol(pal.shade)} />
        <path d={`M${rig.hand[0] + 4} ${rig.hand[1] + 6} l6 6 M${rig.hand[0] - 2} ${rig.hand[1] + 7} l3 7`} {...ol(pal.shade, 2.5)} />
      </g>
    ),
  };
}

// ----------------------------------------------------------------- shark --

const SHARK = "M100 28 C142 28 158 70 158 118 C158 174 136 206 100 206 C64 206 42 174 42 118 C42 70 58 28 100 28 Z";

function shark(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: SHARK,
    headCenter: [100, 116],
    top: 28,
    brow: 58,
    rim: [46, 154],
    body: SHARK,
    armor: [140, 194],
    pauldrons: [
      [52, 140],
      [148, 140],
    ],
    eyes: { y: 80, dx: 27, r: 8.5, lid: pal.main },
    mouth: { x: 100, y: 110, s: 1.35, teeth: true },
    shoulder: [152, 130],
    hand: [172, 154],
    neck: { y: 140, w: 100 },
    offHand: [24, 160],
    bustTop: 2,
  };
  const fin =
    ft.fin === "tall" ? "M84 36 L114 -22 L124 38 Z" : ft.fin === "jagged" ? "M84 36 L94 10 L102 20 L110 -8 L116 12 L124 38 Z" : "M86 36 L112 -4 L122 38 Z";
  return {
    rig,
    behind: (
      <g>
        <path d={fin} fill={pal.main} {...ol(pal.shade)} />
        <g className="hero-tail" style={{ transformOrigin: "66px 194px" }}>
          <path d="M66 194 C44 194 30 186 18 170 C34 172 48 172 60 180 Z" fill={pal.main} {...ol(pal.shade)} />
          <path d="M66 198 C46 202 34 210 28 220 C44 218 58 212 68 204 Z" fill={pal.main} {...ol(pal.shade)} />
        </g>
      </g>
    ),
    body: (
      <g>
        <path d={SHARK} fill={pal.main} {...ol(pal.shade)} />
        <path d="M60 104 C70 94 130 94 140 104 C150 146 134 198 100 202 C66 198 50 146 60 104 Z" fill={pal.light} />
        {ft.pattern === "stripes" && <path d="M60 52 l10 10 M54 66 l10 9 M140 52 l-10 10 M146 66 l-10 9" {...ol(pal.shade, 4)} />}
        {ft.pattern === "spots" && (
          <g fill={pal.light} opacity={0.8}>
            <circle cx={58} cy={70} r={4} />
            <circle cx={66} cy={56} r={3} />
            <circle cx={142} cy={70} r={4} />
            <circle cx={134} cy={56} r={3} />
          </g>
        )}
        <g fill="none" {...ol(pal.shade, 2.5)} opacity={0.7}>
          <path d="M52 116 q4 6 0 12 M58 114 q4 7 0 14" />
          <path d="M148 116 q-4 6 0 12 M142 114 q-4 7 0 14" />
        </g>
        <Feet y={206} dx={18} rx={14} ry={7} fill={pal.main} line={pal.shade} />
      </g>
    ),
    offArm: <path d="M50 126 C32 132 22 148 22 162 C36 158 48 148 56 140 Z" fill={pal.main} {...ol(pal.shade)} />,
    head: null,
    arm: <Limb from={rig.shoulder} to={rig.hand} fill={pal.main} line={pal.shade} w={15} />,
    hand: <path d={`M${rig.hand[0] - 9} ${rig.hand[1] - 4} C${rig.hand[0] - 4} ${rig.hand[1] - 14} ${rig.hand[0] + 12} ${rig.hand[1] - 8} ${rig.hand[0] + 10} ${rig.hand[1] + 6} C${rig.hand[0] + 4} ${rig.hand[1] + 12} ${rig.hand[0] - 8} ${rig.hand[1] + 8} ${rig.hand[0] - 9} ${rig.hand[1] - 4} Z`} fill={pal.main} {...ol(pal.shade)} />,
  };
}

// ---------------------------------------------------------------- dragon --

function dragon(pal: Palette, ft: Record<string, string>): Parts {
  const rig = standardRig(pal, { mouth: { x: 100, y: 118, s: 1, teeth: true } });
  const horn =
    ft.horns === "straight"
      ? "M66 50 L60 6 L86 40 Z"
      : "M64 52 C54 30 58 12 72 4 C68 22 74 34 86 42 Z";
  const wing = "M70 142 C46 112 22 112 10 126 C22 130 24 140 18 150 C32 146 38 154 36 164 C48 154 60 154 70 160 Z";
  const wings = ft.wings !== "none" && (
    <g transform={ft.wings === "big" ? "translate(70 150) scale(1.45) translate(-70 -150)" : undefined}>
      <path d={wing} fill={pal.main} {...ol(pal.shade)} />
      <path d="M66 146 L24 128 M64 150 L28 150" {...ol(pal.shade, 2)} opacity={0.6} />
    </g>
  );
  return {
    rig,
    behind: (
      <g>
        {wings}
        {wings && <g transform="translate(200 0) scale(-1 1)">{wings}</g>}
        <g className="hero-tail" style={{ transformOrigin: "70px 190px" }}>
          <path d="M70 190 C40 202 20 188 16 166" fill="none" stroke={pal.shade} strokeWidth={18} strokeLinecap="round" />
          <path d="M70 190 C40 202 20 188 16 166" fill="none" stroke={pal.main} strokeWidth={12} strokeLinecap="round" />
          <path d="M16 166 L4 150 L26 152 Z" fill={pal.accent} {...ol(pal.shade, 2)} />
        </g>
        <path d={horn} fill={pal.accent} {...ol(pal.shade)} />
        <path d={mirror(horn)} fill={pal.accent} {...ol(pal.shade)} />
        {ft.horns === "triple" && <path d="M92 40 L100 8 L108 40 Z" fill={pal.accent} {...ol(pal.shade)} />}
        <path d="M46 98 L30 92 L44 84 Z M154 98 L170 92 L156 84 Z" fill={pal.accent} {...ol(pal.shade, 2)} />
      </g>
    ),
    body: (
      <g>
        <path d={BODY} fill={pal.main} {...ol(pal.shade)} />
        <path d="M84 132 C92 128 108 128 116 132 C124 156 120 190 100 196 C80 190 76 156 84 132 Z" fill={pal.light} />
        <path d="M82 148 H118 M80 164 H120 M82 180 H118" {...ol(pal.shade, 1.8)} opacity={0.45} />
        <Feet fill={pal.main} line={pal.shade} />
      </g>
    ),
    ...standardArms(pal, rig),
    head: (
      <g>
        <path d={HEAD} fill={pal.main} {...ol(pal.shade)} />
        <ellipse cx={100} cy={112} rx={25} ry={17} fill={pal.light} />
        <circle cx={92} cy={106} r={2.6} fill={pal.shade} />
        <circle cx={108} cy={106} r={2.6} fill={pal.shade} />
      </g>
    ),
  };
}

// ----------------------------------------------------------------- slime --

const SLIME = "M100 72 C148 72 170 118 172 168 C174 196 158 208 100 208 C42 208 26 196 28 168 C30 118 52 72 100 72 Z";

function slime(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: SLIME,
    headCenter: [100, 140],
    top: 72,
    brow: 112,
    rim: [38, 162],
    body: SLIME,
    armor: [178, 207],
    pauldrons: [
      [40, 176],
      [160, 176],
    ],
    eyes: { y: 139, dx: 25, r: 10, lid: pal.main },
    mouth: { x: 100, y: 161, s: 1.1 },
    shoulder: [160, 164],
    hand: [182, 152],
    neck: { y: 186, w: 126 },
    offHand: [24, 182],
    bustTop: 58,
  };
  const top =
    ft.top === "bubbles" ? (
      <g fill={pal.main} {...ol(pal.shade)}>
        <circle cx={82} cy={64} r={7} />
        <circle cx={100} cy={54} r={9} />
        <circle cx={118} cy={64} r={7} />
      </g>
    ) : ft.top === "leaf" ? (
      <g>
        <path d="M100 74 L100 56" {...ol("#3f7d2a", 3)} />
        <path d="M100 58 C104 40 124 36 132 44 C124 58 110 60 100 58 Z" fill="#6cc04a" {...ol("#3f7d2a", 2.5)} />
      </g>
    ) : (
      <path d="M100 76 C90 76 88 62 100 42 C112 62 110 76 100 76 Z" fill={pal.main} {...ol(pal.shade)} />
    );
  return {
    rig,
    behind: top,
    body: (
      <g>
        <path d={SLIME} fill={pal.main} {...ol(pal.shade)} />
        <path d="M44 182 C60 200 140 200 156 182 C150 200 130 206 100 206 C70 206 50 200 44 182 Z" fill={pal.shade} opacity={0.25} />
        {ft.pattern === "bubbles" && (
          <g fill={pal.light} opacity={0.55}>
            <circle cx={60} cy={176} r={6} />
            <circle cx={140} cy={182} r={4} />
            <circle cx={150} cy={150} r={5} />
            <circle cx={50} cy={150} r={3.5} />
          </g>
        )}
        {ft.pattern === "sparkle" && (
          <g fill="#ffffff" opacity={0.85}>
            {[
              [56, 160],
              [146, 150],
              [138, 184],
            ].map(([x, y]) => (
              <path key={`${x}${y}`} d={`M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z`} />
            ))}
          </g>
        )}
        <ellipse cx={64} cy={112} rx={12} ry={7} transform="rotate(-35 64 112)" fill="#ffffff" opacity={0.55} />
        <circle cx={78} cy={98} r={3.5} fill="#ffffff" opacity={0.55} />
      </g>
    ),
    offArm: <path d="M34 166 C18 164 14 182 26 188 C34 190 38 184 40 176 Z" fill={pal.main} {...ol(pal.shade)} />,
    head: null,
    arm: <path d={`M156 154 C168 150 176 146 ${rig.hand[0]} ${rig.hand[1]} L${rig.hand[0] + 2} ${rig.hand[1] + 10} C174 168 166 172 158 174 Z`} fill={pal.main} {...ol(pal.shade)} />,
    hand: <ellipse cx={rig.hand[0]} cy={rig.hand[1] + 2} rx={9} ry={9.5} fill={pal.main} {...ol(pal.shade)} />,
  };
}

// --------------------------------------------------------------- monster --

function fuzzyCircle(cx: number, cy: number, r: number, bumps: number, depth: number): string {
  let d = "";
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) {
      d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      continue;
    }
    const mid = a - Math.PI / bumps;
    const qx = cx + Math.cos(mid) * (r + depth);
    const qy = cy + Math.sin(mid) * (r + depth);
    d += ` Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + " Z";
}

const MONSTER = fuzzyCircle(100, 128, 72, 26, 7);

function monster(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: MONSTER,
    headCenter: [100, 128],
    top: 50,
    brow: 86,
    rim: [34, 166],
    body: MONSTER,
    armor: [164, 200],
    pauldrons: [
      [40, 160],
      [160, 160],
    ],
    eyes: { y: 110, dx: 26, r: 12, lid: pal.main },
    mouth: { x: 100, y: 142, s: 1.45, teeth: true },
    shoulder: [166, 146],
    hand: [184, 164],
    neck: { y: 172, w: 110 },
    offHand: [18, 166],
    bustTop: 30,
  };
  const horn =
    ft.horns === "big" ? "M62 72 C40 52 40 26 56 12 C58 34 68 48 84 58 Z" : "M66 66 C58 52 60 40 68 32 C72 44 76 52 82 58 Z";
  return {
    rig,
    behind:
      ft.horns === "none" ? null : (
        <g>
          <path d={horn} fill={pal.accent} {...ol(pal.shade)} />
          <path d={mirror(horn)} fill={pal.accent} {...ol(pal.shade)} />
        </g>
      ),
    body: (
      <g>
        <Feet y={204} dx={24} fill={pal.shade} line={pal.shade} rx={16} ry={9} />
        <path d={MONSTER} fill={pal.main} {...ol(pal.shade)} />
        {ft.pattern === "belly" && <ellipse cx={100} cy={170} rx={42} ry={28} fill={pal.light} />}
        {ft.pattern === "spots" && (
          <g fill={pal.accent} opacity={0.75}>
            <circle cx={48} cy={110} r={7} />
            <circle cx={58} cy={170} r={6} />
            <circle cx={150} cy={108} r={5} />
            <circle cx={146} cy={176} r={8} />
            <circle cx={124} cy={190} r={4} />
          </g>
        )}
      </g>
    ),
    offArm: (
      <g>
        <Limb from={[34, 142]} to={[18, 166]} fill={pal.main} line={pal.shade} w={14} />
        <Paw at={[18, 166]} fill={pal.main} line={pal.shade} r={8} />
      </g>
    ),
    head: null,
    arm: <Limb from={rig.shoulder} to={rig.hand} fill={pal.main} line={pal.shade} w={14} />,
    hand: <Paw at={rig.hand} fill={pal.main} line={pal.shade} r={8.5} />,
  };
}

// ----------------------------------------------------------------- alien --

const ALIEN_HEAD = "M100 24 C150 24 164 58 160 88 C156 118 130 138 100 138 C70 138 44 118 40 88 C36 58 50 24 100 24 Z";
const ALIEN_BODY = "M100 132 C120 132 130 150 130 172 C130 196 118 206 100 206 C82 206 70 196 70 172 C70 150 80 132 100 132 Z";

function alien(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: ALIEN_HEAD,
    headCenter: [100, 82],
    top: 24,
    brow: 56,
    rim: [40, 160],
    body: ALIEN_BODY,
    armor: [150, 194],
    pauldrons: [
      [74, 150],
      [126, 150],
    ],
    eyes: { y: 90, dx: 25, r: 12.5, lid: pal.main },
    mouth: { x: 100, y: 120, s: 0.9 },
    shoulder: [126, 152],
    hand: [150, 168],
    neck: { y: 137, w: 44 },
    offHand: [52, 172],
    bustTop: 2,
  };
  const antenna = (x1: number, x2: number, y2: number) => (
    <g key={x2}>
      <path d={`M${x1} 32 Q${(x1 + x2) / 2} ${y2 + 18} ${x2} ${y2}`} fill="none" {...ol(pal.shade, 4)} />
      <circle cx={x2} cy={y2} r={6.5} fill={pal.accent} {...ol(pal.shade, 2)} />
    </g>
  );
  return {
    rig,
    behind:
      ft.antenna === "none" ? null : ft.antenna === "one" ? (
        antenna(100, 100, -12)
      ) : (
        <g>
          {antenna(80, 62, -4)}
          {antenna(120, 138, -4)}
        </g>
      ),
    body: (
      <g>
        <path d={ALIEN_BODY} fill={pal.main} {...ol(pal.shade)} />
        {ft.pattern === "stripes" && <path d="M78 176 H122 M80 188 H120" {...ol(pal.light, 4)} />}
        <Feet y={206} dx={15} rx={13} ry={8} fill={pal.main} line={pal.shade} />
      </g>
    ),
    offArm: (
      <g>
        <Limb from={[74, 152]} to={[52, 172]} fill={pal.main} line={pal.shade} w={11} />
        <Paw at={[52, 172]} fill={pal.main} line={pal.shade} r={7.5} />
      </g>
    ),
    head: (
      <g>
        <path d={ALIEN_HEAD} fill={pal.main} {...ol(pal.shade)} />
        {ft.pattern === "spots" && (
          <g fill={pal.light} opacity={0.8}>
            <circle cx={54} cy={100} r={5} />
            <circle cx={62} cy={112} r={3} />
            <circle cx={146} cy={100} r={5} />
            <circle cx={138} cy={112} r={3} />
          </g>
        )}
        {ft.pattern === "stripes" && <path d="M48 96 l10 2 M152 96 l-10 2" {...ol(pal.light, 4)} />}
      </g>
    ),
    arm: <Limb from={rig.shoulder} to={rig.hand} fill={pal.main} line={pal.shade} w={11} />,
    hand: <Paw at={rig.hand} fill={pal.main} line={pal.shade} r={8} />,
  };
}

// ----------------------------------------------------------------- robot --

const ROBOT_HEAD = roundRect(46, 28, 108, 92, 20);
const ROBOT_BODY = roundRect(62, 126, 76, 72, 16);
const SCREEN = "#1c2430";

function gearShape(cx: number, cy: number, r: number): string {
  let d = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.78;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + "Z";
}

function robot(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: ROBOT_HEAD,
    headCenter: [100, 74],
    top: 28,
    brow: 45,
    rim: [42, 158],
    body: ROBOT_BODY,
    armor: [168, 198],
    pauldrons: [
      [64, 138],
      [136, 138],
    ],
    eyes: { y: 76, dx: 20, r: 9, lid: SCREEN, ink: pal.accent },
    mouth: { x: 100, y: 96, s: 1, kind: "led" },
    shoulder: [136, 142],
    hand: [158, 162],
    neck: { y: 122, w: 34 },
    offHand: [46, 164],
    bustTop: 0,
  };
  const antenna =
    ft.antenna === "dish" ? (
      <g>
        <path d="M100 30 V10" {...ol(pal.shade, 4)} />
        <path d="M84 10 Q100 24 116 10 Z" fill={pal.main} {...ol(pal.shade, 2.5)} />
        <circle cx={100} cy={8} r={3} fill={pal.accent} />
      </g>
    ) : ft.antenna === "bulb" ? (
      <g>
        <path d="M100 30 V10" {...ol(pal.shade, 4)} />
        <circle cx={100} cy={4} r={8} fill={pal.accent} {...ol(pal.shade, 2.5)} />
        <circle cx={97} cy={1} r={2.5} fill="#ffffff" opacity={0.8} />
      </g>
    ) : (
      <g>
        <path d="M100 30 V14" {...ol(pal.shade, 4)} />
        <path d="M102 -8 L92 6 L100 6 L96 18 L108 2 L100 2 Z" fill={pal.accent} {...ol(pal.shade, 2)} />
      </g>
    );
  const claw = (at: Pt) => (
    <g>
      <circle cx={at[0]} cy={at[1]} r={8} fill={pal.main} {...ol(pal.shade)} />
      <path d={`M${at[0] - 9} ${at[1] - 4} q-4 8 2 12 M${at[0] + 9} ${at[1] - 4} q4 8 -2 12`} fill="none" {...ol(pal.shade, 3.5)} />
    </g>
  );
  return {
    rig,
    behind: antenna,
    body: (
      <g>
        <path d="M80 194 H92 V206 H80 Z M108 194 H120 V206 H108 Z" fill={pal.shade} />
        <path d={roundRect(70, 202, 28, 10, 5)} fill={pal.main} {...ol(pal.shade)} />
        <path d={roundRect(102, 202, 28, 10, 5)} fill={pal.main} {...ol(pal.shade)} />
        <path d={roundRect(90, 116, 20, 12, 3)} fill={pal.shade} />
        <path d={ROBOT_BODY} fill={pal.main} {...ol(pal.shade)} />
        {ft.panel === "gears" ? (
          <g>
            <path d={gearShape(88, 148, 11)} fill={pal.light} {...ol(pal.shade, 2)} />
            <circle cx={88} cy={148} r={3.5} fill={pal.shade} />
            <path d={gearShape(110, 156, 8)} fill={pal.accent} {...ol(pal.shade, 2)} />
            <circle cx={110} cy={156} r={2.5} fill={pal.shade} />
          </g>
        ) : ft.panel === "vents" ? (
          <g {...ol(pal.shade, 3)}>
            <path d="M80 140 H120 M80 148 H120 M80 156 H120" />
          </g>
        ) : (
          <g>
            <path d={roundRect(80, 134, 40, 28, 6)} fill={SCREEN} {...ol(pal.shade, 2)} />
            <path d={heart(100, 148, 0.65)} fill={pal.accent} />
          </g>
        )}
      </g>
    ),
    offArm: (
      <g>
        <Limb from={[64, 142]} to={[46, 164]} fill={pal.light} line={pal.shade} w={11} />
        <circle cx={64} cy={142} r={6} fill={pal.main} {...ol(pal.shade, 2)} />
        {claw([46, 164])}
      </g>
    ),
    head: (
      <g>
        <path d={ROBOT_HEAD} fill={pal.main} {...ol(pal.shade)} />
        <circle cx={46} cy={78} r={6} fill={pal.light} {...ol(pal.shade, 2)} />
        <circle cx={154} cy={78} r={6} fill={pal.light} {...ol(pal.shade, 2)} />
        <path d={roundRect(58, 50, 84, 58, 12)} fill={SCREEN} {...ol(pal.shade, 2)} />
        <path d="M64 58 Q70 54 78 54" fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
    arm: (
      <g>
        <Limb from={rig.shoulder} to={rig.hand} fill={pal.light} line={pal.shade} w={11} />
        <circle cx={rig.shoulder[0]} cy={rig.shoulder[1]} r={6} fill={pal.main} {...ol(pal.shade, 2)} />
      </g>
    ),
    hand: claw(rig.hand),
  };
}

// ---------------------------------------------------------------- cactus --

const CACTUS = "M100 38 C130 38 140 60 140 90 L140 180 C140 200 126 206 100 206 C74 206 60 200 60 180 L60 90 C60 60 70 38 100 38 Z";

function flower(cx: number, cy: number, s: number, color: string, line: string) {
  return (
    <g key={`${cx}${cy}`} transform={`translate(${cx} ${cy}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-8} rx={5.5} ry={8} transform={`rotate(${a})`} fill={color} {...ol(line, 1.5)} />
      ))}
      <circle r={4.5} fill="#ffd84d" {...ol(line, 1.5)} />
    </g>
  );
}

function cactus(pal: Palette, ft: Record<string, string>): Parts {
  const rig: Rig = {
    head: CACTUS,
    headCenter: [100, 100],
    top: 38,
    brow: 66,
    rim: [58, 142],
    body: CACTUS,
    armor: [134, 184],
    pauldrons: [
      [62, 136],
      [138, 136],
    ],
    eyes: { y: 90, dx: 18, r: 8, lid: pal.main },
    mouth: { x: 100, y: 110, s: 0.95 },
    shoulder: [140, 152],
    hand: [162, 132],
    neck: { y: 131, w: 76 },
    offHand: [38, 118],
    bustTop: 10,
  };
  const spots: Pt[] =
    ft.spines === "many"
      ? [
          [70, 120], [130, 120], [70, 150], [130, 150], [80, 172], [120, 172], [90, 136], [110, 136], [70, 186], [130, 186], [100, 190], [68, 100], [132, 100],
        ]
      : [
          [70, 124], [130, 128], [78, 166], [122, 170], [100, 186], [66, 100], [134, 100],
        ];
  const spines =
    ft.spines === "fluff" ? (
      <g fill="#ffffff" opacity={0.9}>
        {spots.map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={2.6} />
        ))}
      </g>
    ) : (
      <g fill="none" {...ol(pal.light, 2)}>
        {spots.map(([x, y]) => (
          <path key={`${x}${y}`} d={`M${x - 3} ${y - 3} L${x} ${y} L${x + 3} ${y - 3}`} />
        ))}
      </g>
    );
  return {
    rig,
    behind:
      ft.flower === "none" ? null : ft.flower === "three" ? (
        <g>
          {flower(78, 36, 0.8, pal.accent, pal.shade)}
          {flower(122, 36, 0.8, pal.accent, pal.shade)}
          {flower(100, 22, 1, pal.accent, pal.shade)}
        </g>
      ) : (
        flower(100, 24, 1.15, pal.accent, pal.shade)
      ),
    body: (
      <g>
        <Feet y={206} dx={18} rx={14} ry={8} fill={pal.shade} line={pal.shade} />
        <path d={CACTUS} fill={pal.main} {...ol(pal.shade)} />
        <path d="M80 56 V196 M120 56 V196" {...ol(pal.shade, 2.5)} opacity={0.35} />
        {spines}
      </g>
    ),
    offArm: (
      <g>
        <path d="M62 150 H44 Q38 150 38 144 V118" fill="none" stroke={pal.shade} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 150 H44 Q38 150 38 144 V118" fill="none" stroke={pal.main} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    head: null,
    arm: (
      <g>
        <path d={`M138 152 H156 Q162 152 162 146 V${rig.hand[1]}`} fill="none" stroke={pal.shade} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M138 152 H156 Q162 152 162 146 V${rig.hand[1]}`} fill="none" stroke={pal.main} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
    hand: <Paw at={rig.hand} fill={pal.main} line={pal.shade} r={9} />,
  };
}

// -------------------------------------------------------------- mushroom --

const CAPS: Record<string, { d: string; center: Pt; top: number; brow: number; rim: Pt; spots: Pt[] }> = {
  round: {
    d: "M28 92 C28 46 62 20 100 20 C138 20 172 46 172 92 C172 104 158 108 100 108 C42 108 28 104 28 92 Z",
    center: [100, 64],
    top: 20,
    brow: 58,
    rim: [32, 168],
    spots: [[50, 86], [78, 94], [124, 94], [152, 84], [100, 80]],
  },
  pointy: {
    d: "M30 98 C38 60 70 22 100 6 C130 22 162 60 170 98 C170 108 156 112 100 112 C44 112 30 108 30 98 Z",
    center: [100, 70],
    top: 6,
    brow: 62,
    rim: [46, 154],
    spots: [[52, 94], [80, 98], [122, 98], [148, 92], [100, 84]],
  },
  flat: {
    d: "M18 92 C20 64 56 44 100 44 C144 44 180 64 182 92 C182 104 166 108 100 108 C34 108 18 104 18 92 Z",
    center: [100, 78],
    top: 44,
    brow: 70,
    rim: [24, 176],
    spots: [[40, 90], [72, 96], [128, 96], [160, 90], [100, 86]],
  },
};

const STEM = "M100 96 C126 96 136 118 136 148 C136 186 126 206 100 206 C74 206 64 186 64 148 C64 118 74 96 100 96 Z";

function mushroom(pal: Palette, ft: Record<string, string>): Parts {
  const cap = CAPS[ft.cap] ?? CAPS.round;
  const rig: Rig = {
    head: cap.d,
    headCenter: cap.center,
    top: cap.top,
    brow: cap.brow,
    rim: cap.rim,
    body: STEM,
    armor: [160, 198],
    pauldrons: [
      [68, 156],
      [132, 156],
    ],
    eyes: { y: 129, dx: 16, r: 7.5, lid: pal.light },
    mouth: { x: 100, y: 146, s: 0.85 },
    shoulder: [132, 160],
    hand: [154, 172],
    neck: { y: 164, w: 62 },
    offHand: [48, 180],
    bustTop: 10,
  };
  const line = "#8d7458";
  return {
    rig,
    behind: null,
    body: (
      <g>
        <Feet y={206} dx={17} rx={14} ry={8} fill={pal.light} line={line} />
        <path d={STEM} fill={pal.light} {...ol(line)} />
      </g>
    ),
    offArm: (
      <g>
        <Limb from={[68, 162]} to={[48, 180]} fill={pal.light} line={line} w={12} />
        <Paw at={[48, 180]} fill={pal.light} line={line} r={8} />
      </g>
    ),
    head: (
      <g>
        <path d={cap.d} fill={pal.main} {...ol(pal.shade)} />
        {ft.pattern !== "plain" && ft.pattern !== "rings" && (
          <g fill={pal.accent}>
            {cap.spots.map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx={i % 2 ? 6 : 7.5} ry={i % 2 ? 4.5 : 5.5} />
            ))}
          </g>
        )}
        {ft.pattern === "rings" && (
          <path d={`M${cap.rim[0] + 6} ${cap.brow + 22} Q100 ${cap.brow + 8} ${cap.rim[1] - 6} ${cap.brow + 22}`} fill="none" {...ol(pal.accent, 5)} />
        )}
        <path d="M44 104 Q100 116 156 104" fill="none" {...ol(pal.shade, 2)} opacity={0.4} />
        <g fill="#f29a9a" opacity={0.5}>
          <ellipse cx={78} cy={140} rx={6} ry={3.5} />
          <ellipse cx={122} cy={140} rx={6} ry={3.5} />
        </g>
      </g>
    ),
    arm: <Limb from={rig.shoulder} to={rig.hand} fill={pal.light} line={line} w={12} />,
    hand: <Paw at={rig.hand} fill={pal.light} line={line} r={8} />,
  };
}

export const DRAW: Record<SpeciesId, (pal: Palette, ft: Record<string, string>) => Parts> = {
  cat,
  fox,
  panda,
  bear,
  rabbit,
  owl,
  shark,
  dragon,
  slime,
  monster,
  alien,
  robot,
  cactus,
  mushroom,
};
