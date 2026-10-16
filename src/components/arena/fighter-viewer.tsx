"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { FighterColor } from "@/lib/arena-rules";
import { buildFighter, createStage, type FighterRig } from "./fighter-model";

/** The player's own fighter: idles, turns slowly, and can be rotated by dragging. */
export function FighterViewer({
  color,
  weapon,
  shield,
  className,
}: {
  color: FighterColor;
  weapon: string;
  shield: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<{ scene: THREE.Scene; rig: FighterRig | null } | null>(null);

  // Renderer, camera and loop: created once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stage: ReturnType<typeof createStage>;
    try {
      stage = createStage(canvas);
    } catch {
      return; // No WebGL: the page still works, just without the 3D figure.
    }
    const { renderer, scene } = stage;
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0.9, 1.5, 4.4);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.95, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 2.05;

    stageRef.current = { scene, rig: null };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      const t = clock.getElapsedTime();
      const rig = stageRef.current?.rig;
      if (rig) {
        rig.body.position.y = Math.sin(t * 2.2) * 0.015;
        rig.rightArm.rotation.x = -0.35 + Math.sin(t * 2.2) * 0.04;
        rig.leftArm.rotation.x = -0.6 - Math.sin(t * 2.2) * 0.03;
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      stageRef.current?.rig?.dispose();
      stageRef.current = null;
      stage.dispose();
    };
  }, []);

  // The figure itself: rebuilt whenever the loadout changes.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rig = buildFighter(color, weapon, shield);
    stage.scene.add(rig.root);
    const previous = stage.rig;
    stage.rig = rig;
    if (previous) {
      stage.scene.remove(previous.root);
      previous.dispose();
    }
  }, [color, weapon, shield]);

  return <canvas ref={canvasRef} className={className} style={{ touchAction: "pan-y", cursor: "grab" }} aria-label="3D-модель твоего бойца" />;
}
