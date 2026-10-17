"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import type { FighterColor } from "@/lib/arena-rules";
import { buildFighter, createStage, type FighterRig } from "./fighter-model";

/** Painted character with breathing motion and a small pointer-driven parallax. */
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
  const [unavailable, setUnavailable] = useState(false);
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
      setUnavailable(true);
      return;
    }
    const { renderer, scene } = stage;
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 1.3, 4.7);
    camera.lookAt(0, 1.05, 0);
    let pointer = 0;
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = ((event.clientX - rect.left) / rect.width - 0.5) * 0.18;
    };
    const leave = () => { pointer = 0; };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

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
        rig.body.position.y = reduced.matches ? 0 : Math.sin(t * 2.2) * 0.015;
        rig.body.rotation.y += (pointer - rig.body.rotation.y) * 0.06;
        rig.rightArm.rotation.x = -0.35 + (reduced.matches ? 0 : Math.sin(t * 2.2) * 0.04);
        rig.leftArm.rotation.x = -0.6 - (reduced.matches ? 0 : Math.sin(t * 2.2) * 0.03);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
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

  if (unavailable) return <img src="/characters/step-guardian.png" alt="Твой герой-путешественник" className={(className ?? "") + " object-contain"} />;
  return <canvas ref={canvasRef} className={className} style={{ touchAction: "pan-y" }} role="img" aria-label="Твой герой-путешественник в выбранном снаряжении" />;
}
