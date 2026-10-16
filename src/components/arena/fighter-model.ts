import * as THREE from "three";

import { COLORS, item, type FighterColor } from "@/lib/arena-rules";

/**
 * A small stylised fighter built from primitives — no model files to load.
 * Arms hang from shoulder pivots so the duel scene can swing them; the weapon
 * sits in the right hand, the shield on the left forearm.
 */

export interface FighterRig {
  root: THREE.Group;
  body: THREE.Group;
  rightArm: THREE.Group;
  leftArm: THREE.Group;
  /** Materials that flash red when hit. */
  flashables: THREE.MeshStandardMaterial[];
  dispose(): void;
}

const SKIN = "#f1c7a3";
const DARK = "#2a2723";

function mat(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...opts });
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// --------------------------------------------------------------- weapons --

function buildWeapon(model: string): THREE.Group {
  const g = new THREE.Group();
  const wood = mat("#8a5a33");
  const leather = mat("#4a3426");
  const iron = mat("#b9bec6", { metalness: 0.75, roughness: 0.3 });
  const gold = mat("#d4a72c", { metalness: 0.8, roughness: 0.3 });

  const handle = (length: number, material = leather) => mesh(new THREE.CylinderGeometry(0.035, 0.035, length, 10), material, 0, 0, 0);

  switch (model) {
    case "dagger": {
      g.add(handle(0.18));
      g.add(mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), mat("#a8743a", { metalness: 0.6, roughness: 0.35 }), 0, 0.1, 0));
      const blade = mesh(new THREE.BoxGeometry(0.07, 0.36, 0.02), mat("#c98f4a", { metalness: 0.7, roughness: 0.3 }), 0, 0.3, 0);
      g.add(blade);
      break;
    }
    case "sword-iron":
    case "sword-dawn":
    case "sword-wood": {
      const bladeMat =
        model === "sword-wood"
          ? mat("#b07a45")
          : model === "sword-dawn"
            ? mat("#ffd36b", { metalness: 0.6, roughness: 0.25, emissive: "#ff9a1f", emissiveIntensity: 0.55 })
            : iron;
      g.add(handle(0.22, model === "sword-wood" ? wood : leather));
      g.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.07), model === "sword-wood" ? wood : gold, 0, 0.13, 0));
      const length = model === "sword-wood" ? 0.62 : 0.78;
      g.add(mesh(new THREE.BoxGeometry(0.085, length, 0.025), bladeMat, 0, 0.15 + length / 2, 0));
      g.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 4), bladeMat, 0, 0.2 + length, 0));
      break;
    }
    case "axe": {
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.95, 10), wood, 0, 0.3, 0));
      const head = new THREE.Shape();
      head.moveTo(0, -0.1);
      head.quadraticCurveTo(0.22, -0.2, 0.3, -0.24);
      head.lineTo(0.3, 0.24);
      head.quadraticCurveTo(0.22, 0.2, 0, 0.1);
      head.closePath();
      const blade = mesh(new THREE.ExtrudeGeometry(head, { depth: 0.04, bevelEnabled: false }), iron, 0.02, 0.62, -0.02);
      g.add(blade);
      break;
    }
    case "hammer": {
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.9, 10), wood, 0, 0.28, 0));
      g.add(mesh(new THREE.BoxGeometry(0.36, 0.2, 0.2), mat("#6e747c", { metalness: 0.7, roughness: 0.35 }), 0, 0.72, 0));
      g.add(mesh(new THREE.BoxGeometry(0.4, 0.05, 0.22), gold, 0, 0.72, 0));
      break;
    }
  }
  return g;
}

// --------------------------------------------------------------- shields --

function buildShield(model: string): THREE.Group {
  const g = new THREE.Group();
  const wood = mat("#9a6a3c");
  const iron = mat("#9aa1aa", { metalness: 0.7, roughness: 0.35 });
  const gold = mat("#d4a72c", { metalness: 0.85, roughness: 0.25 });

  const disc = (radius: number, material: THREE.Material, depth = 0.06) => {
    const m = mesh(new THREE.CylinderGeometry(radius, radius, depth, 28), material);
    m.rotation.x = Math.PI / 2;
    return m;
  };

  switch (model) {
    case "shield-plank": {
      for (let i = -1; i <= 1; i++) g.add(mesh(new THREE.BoxGeometry(0.15, 0.5, 0.05), wood, i * 0.155, 0, 0));
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.07), mat("#5d4127"), 0, 0.12, 0));
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.07), mat("#5d4127"), 0, -0.12, 0));
      break;
    }
    case "buckler": {
      g.add(disc(0.2, mat("#7b5136")));
      g.add(disc(0.07, iron, 0.1));
      break;
    }
    case "shield-round": {
      g.add(disc(0.32, iron));
      g.add(disc(0.26, mat("#5a6470", { metalness: 0.5, roughness: 0.45 }), 0.07));
      g.add(disc(0.07, gold, 0.11));
      break;
    }
    case "shield-kite": {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.36);
      shape.quadraticCurveTo(0.28, 0.36, 0.28, 0.12);
      shape.quadraticCurveTo(0.24, -0.18, 0, -0.48);
      shape.quadraticCurveTo(-0.24, -0.18, -0.28, 0.12);
      shape.quadraticCurveTo(-0.28, 0.36, 0, 0.36);
      g.add(mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), mat("#7a2f2a"), 0, 0, -0.03));
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.6, 0.04), gold, 0, -0.04, 0.04));
      g.add(mesh(new THREE.BoxGeometry(0.38, 0.06, 0.04), gold, 0, 0.12, 0.04));
      break;
    }
    case "shield-tower": {
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.95, 0.07), mat("#4b5a6b", { metalness: 0.4, roughness: 0.5 })));
      g.add(mesh(new THREE.BoxGeometry(0.54, 0.06, 0.09), iron, 0, 0.45, 0));
      g.add(mesh(new THREE.BoxGeometry(0.54, 0.06, 0.09), iron, 0, -0.45, 0));
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.9, 0.09), iron, 0, 0, 0.01));
      break;
    }
    case "shield-aegis": {
      g.add(disc(0.36, gold));
      g.add(disc(0.29, mat("#f3e1a6", { metalness: 0.4, roughness: 0.35 }), 0.07));
      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.18 : 0.08;
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      star.closePath();
      g.add(mesh(new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: false }), gold, 0, 0, 0.035));
      break;
    }
  }
  return g;
}

// ---------------------------------------------------------------- figure --

export function buildFighter(color: FighterColor, weaponId: string, shieldId: string): FighterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const outfit = mat(COLORS[color].hex);
  const outfitDark = mat(new THREE.Color(COLORS[color].hex).multiplyScalar(0.7).getStyle());
  const skin = mat(SKIN);
  const dark = mat(DARK);
  const boots = mat("#3d332b");

  // Legs
  for (const side of [-1, 1]) {
    body.add(mesh(new THREE.CapsuleGeometry(0.11, 0.32, 4, 10), outfitDark, side * 0.14, 0.38, 0));
    body.add(mesh(new THREE.BoxGeometry(0.2, 0.12, 0.28), boots, side * 0.14, 0.08, 0.04));
  }

  // Torso, belt, head
  body.add(mesh(new THREE.CapsuleGeometry(0.27, 0.36, 6, 14), outfit, 0, 0.98, 0));
  body.add(mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.08, 18), mat("#5a4330"), 0, 0.78, 0));
  body.add(mesh(new THREE.BoxGeometry(0.1, 0.09, 0.04), mat("#d4a72c", { metalness: 0.8, roughness: 0.3 }), 0, 0.78, 0.29));
  body.add(mesh(new THREE.SphereGeometry(0.25, 24, 18), skin, 0, 1.55, 0));

  // Hair cap, eyes, a hint of a smile
  const hair = mesh(new THREE.SphereGeometry(0.262, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.1), dark, 0, 1.58, -0.01);
  hair.rotation.x = -0.25;
  body.add(hair);
  for (const side of [-1, 1]) body.add(mesh(new THREE.SphereGeometry(0.032, 10, 8), dark, side * 0.09, 1.56, 0.225));
  const smile = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI), dark, 0, 1.47, 0.23);
  smile.rotation.z = Math.PI;
  body.add(smile);

  // Arms: a pivot at each shoulder, the arm hanging below it.
  const arm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.36, 1.22, 0);
    pivot.add(mesh(new THREE.CapsuleGeometry(0.085, 0.36, 4, 10), outfit, 0, -0.24, 0));
    pivot.add(mesh(new THREE.SphereGeometry(0.09, 12, 10), skin, 0, -0.5, 0));
    body.add(pivot);
    return pivot;
  };
  const rightArm = arm(1);
  const leftArm = arm(-1);
  rightArm.rotation.x = -0.35;
  leftArm.rotation.x = -0.6;

  const weapon = buildWeapon(item(weaponId).model);
  weapon.position.set(0, -0.52, 0.04);
  weapon.rotation.x = Math.PI / 2.2;
  rightArm.add(weapon);

  const shield = buildShield(item(shieldId).model);
  shield.position.set(-0.05, -0.36, 0.17);
  shield.rotation.y = -0.25;
  leftArm.add(shield);

  const flashables = [outfit, outfitDark, skin];

  return {
    root,
    body,
    rightArm,
    leftArm,
    flashables,
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose());
        }
      });
    },
  };
}

/** Renderer, lights and a ground disc, shared by both 3D views. */
export function createStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#ffffff", "#d9d3c7", 1.6));
  const sun = new THREE.DirectionalLight("#fff4e6", 2.2);
  sun.position.set(3, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4;
  sun.shadow.camera.right = 4;
  sun.shadow.camera.top = 4;
  sun.shadow.camera.bottom = -4;
  sun.shadow.radius = 4;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshStandardMaterial({ color: "#ebe7df", roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.2, 64), new THREE.MeshBasicMaterial({ color: "#d3cfc6" }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  scene.add(ring);

  return {
    renderer,
    scene,
    dispose() {
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      renderer.dispose();
    },
  };
}
