"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { clamp, damp, lerp, smoothstep } from "@/lib/math";
import { skeinPoint, type Vec3Tuple } from "@/lib/stellarator";
import { on, store } from "@/lib/store";
import { rig } from "@/components/webgl/rig";
import { SHAPE } from "@/shaders/particles.glsl";

type Track = readonly (readonly [time: number, value: number])[];

function sample(track: Track, t: number): number {
  if (t <= track[0][0]) return track[0][1];
  for (let i = 1; i < track.length; i++) {
    if (t <= track[i][0]) {
      const from = track[i - 1];
      const to = track[i];
      return lerp(from[1], to[1], smoothstep(from[0], to[0], t));
    }
  }
  return track[track.length - 1][1];
}

/*
 * The shot list. Time is in chapters: 0 thread, 1 tension, 2 winding,
 * 3 ignition, 4 inside, 5 yield, 6 tie-in. Camera tracks are an orbit around a
 * target: azimuth and elevation in radians, distance in world units.
 */
const DISTANCE: Track = [[0, 10.6], [0.8, 8.8], [1.3, 5.0], [1.8, 5.4], [2.1, 14.5], [2.9, 13.5], [3.25, 10], [3.9, 8.6], [5.1, 7.2], [5.85, 7.2], [6.3, 17], [7, 16]];
const ELEVATION: Track = [[0, 0.31], [1.3, 0.15], [2.1, 0.44], [2.9, 0.36], [3.3, 0.24], [3.9, 0.16], [5.1, 0.02], [5.85, 0.02], [6.3, 0.36], [7, 0.32]];
const AZIMUTH: Track = [[0, 0], [1.3, 0.75], [2.0, 0.5], [3.0, 1.05], [3.4, 1.5], [3.9, 1.72], [5.0, 0], [6, 0], [7, 0.35]];
const TARGET_REACH: Track = [[0, 0], [1.3, 0.78], [1.8, 0.7], [2.1, 0], [7, 0]];
// Where the subject sits in the frame: world units to the right and up, at the target's depth.
const SHIFT: Track = [[0, 0], [0.9, 0], [1.3, 1.1], [1.85, 1.1], [2.1, 3.1], [2.95, 3.1], [3.25, 0], [7, 0]];
const RISE: Track = [[0, 1.0], [0.8, 0.5], [1.3, 0], [5.9, 0], [6.3, 2.7], [7, 2.7]];
const TARGET_Y: Track = [[0, 0.1], [1.3, 0], [7, 0]];
const TARGET_PAN: Track = [[5.0, 0], [5.15, -2.6], [5.85, 2.6], [6.15, 0]];
const FOV: Track = [[0, 36], [3.88, 36], [4.1, 64], [4.88, 64], [5.12, 34], [7, 34]];
const FIT: Track = [[0, 1], [1.3, 0.35], [1.9, 0.5], [2.1, 1], [3.9, 1], [5.1, 0.45], [5.85, 0.45], [6.3, 0.6]];
const SWAY: Track = [[0, 1], [3.9, 1], [4.0, 0], [6.1, 0], [6.5, 1]];
const INSIDE: Track = [[3.86, 0], [4.08, 1], [4.86, 1], [5.08, 0]];

const SPREAD: Track = [[1.0, 0], [1.42, 1], [1.72, 0.3], [1.98, 0]];
const TURBULENCE: Track = [[1.0, 0], [1.4, 1.7], [1.85, 0.25], [2.05, 0], [4.98, 0], [5.2, 1.3], [5.45, 0], [5.8, 0], [5.98, 1.3], [6.2, 0]];
const FOLLOW: Track = [[1.0, 2.4], [1.4, 1.1], [2.0, 2.4], [4.0, 2.4], [4.1, 5], [4.9, 5], [5.1, 2.0], [7, 2.4]];
const FLOW: Track = [[0, 0.12], [3.9, 0.12], [4.1, 0.34], [4.9, 0.34], [5.2, 1], [5.85, 1], [6.2, 0.1]];
const STREAK: Track = [[0, 0.06], [3.9, 0.06], [4.1, 0.1], [4.9, 0.1], [5.2, 0.03], [5.85, 0.03], [6.2, 0.07]];
const PLASMA: Track = [[0, 1], [1.2, 1], [1.45, 0.4], [1.92, 1], [3.9, 1], [4.1, 0.4], [4.9, 0.4], [5.22, 0], [5.95, 0], [6.3, 0.9]];
const CORE: Track = [[0, 1], [3.82, 1], [4.0, 0], [6.0, 0], [6.3, 1]];
const HEAT: Track = [[0, 0.3], [2.9, 0.3], [3.1, 0.12], [3.9, 0.12], [4.1, 0.5], [5.0, 0.5], [6.2, 0.4], [7, 0.45]];
const HEAT_INPUT: Track = [[2.9, 0], [3.1, 1], [3.9, 1], [4.1, 0]];
const MACHINE: Track = [[1.8, 0], [2.05, 1], [2.95, 1], [3.15, 0]];
const PARTICLE_ALPHA: Track = [[0, 1], [2.05, 0.5], [2.95, 0.5], [3.2, 1], [3.9, 1], [4.1, 0.28], [4.9, 0.28], [5.1, 1]];
const WORDMARK: Track = [[0, 1], [0.4, 0]];
const LOOM_IN: Track = [[5.0, 0], [5.4, 1]];
const LOOM_OUT: Track = [[5.82, 0], [6.2, 1]];

const INSIDE_START = 0.35;
const INSIDE_SPAN = Math.PI * 0.9;
const LOOK_AHEAD = 0.28;

const axisPoint: Vec3Tuple = [0, 0, 0];
const insidePosition = new THREE.Vector3();
const insideTarget = new THREE.Vector3();
const forward = new THREE.Vector3();
const ray = new THREE.Vector3();

const state = { time: 0, pointerX: 0, pointerY: 0, clock: 0, flash: 0 };

export function Director() {
  useEffect(
    () =>
      on("ignite", () => {
        state.flash = 1;
      }),
    [],
  );

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05);
    const reduced = store.motion.reduced;
    state.clock += dt * (reduced ? 0.35 : 1);
    state.time = damp(state.time, store.scroll.time, reduced ? 18 : 5.5, dt);
    state.pointerX = damp(state.pointerX, reduced ? 0 : store.pointer.x, 4, dt);
    state.pointerY = damp(state.pointerY, reduced ? 0 : store.pointer.y, 4, dt);
    const t = state.time;
    const intro = store.load.intro;
    const introEase = intro * intro * (3 - 2 * intro);

    const sway = sample(SWAY, t);
    const fit = 1 + (Math.max(1, 1.05 / store.viewport.aspect) - 1) * sample(FIT, t);
    const azimuth =
      sample(AZIMUTH, t) + (Math.sin(state.clock * 0.07) * 0.3 + state.pointerX * 0.07) * sway + store.drag.yaw + (1 - introEase) * -0.5;
    const elevation = clamp(sample(ELEVATION, t) - state.pointerY * 0.04 * sway + store.drag.pitch, -0.4, 1.2);
    const distance = sample(DISTANCE, t) * fit * (1 + (1 - introEase) * 0.12);
    const reach = sample(TARGET_REACH, t) * 2.2;

    rig.cameraTarget.set(Math.sin(azimuth) * reach + sample(TARGET_PAN, t), sample(TARGET_Y, t), Math.cos(azimuth) * reach);
    rig.cameraPosition.set(
      rig.cameraTarget.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      rig.cameraTarget.y + Math.sin(elevation) * distance,
      rig.cameraTarget.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
    );

    // Truck the camera so the subject leaves room for the copy; on portrait screens it goes up instead of sideways.
    const portrait = clamp((1.1 - store.viewport.aspect) / 0.5);
    const shift = sample(SHIFT, t);
    const truckX = -shift * (1 - portrait);
    const truckY = -(sample(RISE, t) + shift * portrait * 0.55) * fit;
    const dx = Math.cos(azimuth) * truckX - Math.sin(azimuth) * Math.sin(elevation) * truckY;
    const dy = Math.cos(elevation) * truckY;
    const dz = -Math.sin(azimuth) * truckX - Math.cos(azimuth) * Math.sin(elevation) * truckY;
    rig.cameraTarget.set(rig.cameraTarget.x + dx, rig.cameraTarget.y + dy, rig.cameraTarget.z + dz);
    rig.cameraPosition.set(rig.cameraPosition.x + dx, rig.cameraPosition.y + dy, rig.cameraPosition.z + dz);

    const inside = sample(INSIDE, t);
    if (inside > 0) {
      const travel = INSIDE_START + clamp(t - 4) * INSIDE_SPAN;
      skeinPoint(0, 0, travel, axisPoint);
      insidePosition.set(axisPoint[0], axisPoint[1], axisPoint[2]);
      skeinPoint(0, 0, travel + LOOK_AHEAD, axisPoint);
      insideTarget.set(axisPoint[0], axisPoint[1], axisPoint[2]);
      rig.cameraPosition.lerp(insidePosition, inside);
      rig.cameraTarget.lerp(insideTarget, inside);
    }
    rig.fov = sample(FOV, t);

    const camera = frame.camera;
    camera.position.copy(rig.cameraPosition);
    camera.lookAt(rig.cameraTarget);
    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - rig.fov) > 0.01) {
      camera.fov = rig.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // Pointer on the plane through the target that faces the camera.
    forward.subVectors(rig.cameraTarget, rig.cameraPosition).normalize();
    ray.set(state.pointerX, state.pointerY, 0.5).unproject(camera).sub(rig.cameraPosition).normalize();
    const along = forward.dot(ray);
    if (store.pointer.active && along > 1e-4) {
      const reachDistance = rig.cameraTarget.distanceTo(rig.cameraPosition) / along;
      rig.pointer.copy(rig.cameraPosition).addScaledVector(ray, reachDistance);
      rig.pointerForce = reduced ? 0 : 2.6 * (1 - inside * 0.7);
    } else {
      rig.pointerForce = 0;
    }

    if (t < 5) {
      rig.shapeA = SHAPE.thread;
      rig.shapeB = SHAPE.skein;
      rig.mix = introEase;
    } else if (t < 5.82) {
      rig.shapeA = SHAPE.skein;
      rig.shapeB = SHAPE.loom;
      rig.mix = sample(LOOM_IN, t);
    } else {
      rig.shapeA = SHAPE.loom;
      rig.shapeB = SHAPE.skein;
      rig.mix = sample(LOOM_OUT, t);
    }

    const calm = reduced ? 0.4 : 1;
    rig.time = state.clock;
    rig.reveal = store.load.shown;
    rig.spread = sample(SPREAD, t);
    rig.turbulence = (0.05 + sample(TURBULENCE, t) + Math.sin(Math.PI * intro) * 1.1 + store.heat.value * 0.25) * calm;
    rig.follow = sample(FOLLOW, t);
    rig.flow = sample(FLOW, t) * (1 + store.heat.value * sample(HEAT_INPUT, t) * 1.5);
    rig.streak = sample(STREAK, t);
    rig.plasma = sample(PLASMA, t) * smoothstep(0.4, 1, intro);
    rig.core = sample(CORE, t);
    rig.heat = sample(HEAT, t) + store.heat.value * sample(HEAT_INPUT, t) * 0.88;
    rig.machine = sample(MACHINE, t);
    rig.cut = store.pins.winding;
    rig.cutCenter = Math.atan2(rig.cameraPosition.z, rig.cameraPosition.x);
    rig.particleAlpha = sample(PARTICLE_ALPHA, t);
    rig.wordmark = sample(WORDMARK, t) * smoothstep(0.5, 1, intro);
    state.flash = damp(state.flash, 0, 1.1, dt);
    rig.flash = state.flash;
    rig.aberration = clamp(Math.abs(store.scroll.velocity) / 6000) * 0.6 + state.flash * 0.8;
  }, -2);

  return null;
}
