import * as AA from "@gjmcn/atomic-agents";
import { AtomState } from "../types/chemistry";
import { ELEMENTS } from "../models/element-data";

/**
 * Compute average kinetic energy across all atoms (proxy for temperature).
 */
export function computeAverageKE(atoms: AA.Actor[]): number {
  if (atoms.length === 0) return 0;
  let totalKE = 0;
  for (const atom of atoms) {
    const mass = ELEMENTS[(atom.state as AtomState).elementIndex].mass;
    const vx = atom.vel?.x ?? 0;
    const vy = atom.vel?.y ?? 0;
    totalKE += 0.5 * mass * (vx * vx + vy * vy);
  }
  return totalKE / atoms.length;
}

/**
 * Scale all atom velocities to match a target temperature (average KE).
 * Preserves direction, adjusts magnitude via the vel Vector.
 */
export function setTemperature(atoms: AA.Actor[], targetKE: number) {
  if (atoms.length === 0) return;
  for (const atom of atoms) {
    const mass = ELEMENTS[(atom.state as AtomState).elementIndex].mass;
    const targetSpeed = Math.sqrt(2 * targetKE / mass);

    if (!atom.vel) {
      atom.vel = AA.Vector.randomAngle(targetSpeed);
      continue;
    }

    const vx = atom.vel.x;
    const vy = atom.vel.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed < 0.1) {
      // Atom is effectively stopped — give it a fresh random velocity
      atom.vel = AA.Vector.randomAngle(targetSpeed);
    } else {
      // Scale existing velocity toward target speed
      const ratio = targetSpeed / speed;
      // Blend: 50% toward target each tick for fast response
      const blendedRatio = 1 + (ratio - 1) * 0.5;
      atom.vel = atom.vel.copy().mult(blendedRatio);
    }
  }
}

/**
 * Convert a temperature slider value (100-1000) to an average KE value
 * for the simulation. Linear mapping.
 */
/**
 * Map temperature (K) to KE with an aggressive range so students see
 * a dramatic difference: near-frozen at -20°C, zipping at 200°C.
 *
 * Target H speeds: ~0.3 at -20°C, ~2 at 25°C, ~8 at 200°C.
 * speed = sqrt(2 * KE / mass), so for H (mass=1): KE = speed²/2.
 */
export function temperatureToKE(temperature: number): number {
  const tempC = temperature - 273;
  // Linear map: -20°C → 0.05 KE,  200°C → 32 KE
  const t = (tempC - (-20)) / (200 - (-20)); // 0..1 across slider range
  const clamped = Math.max(0, Math.min(1, t));
  return 0.05 + clamped * clamped * 32; // quadratic ramp for extra drama at high end
}

/**
 * Convert average KE back to temperature (K).
 */
export function keToTemperature(ke: number): number {
  const clamped = Math.max(0, (ke - 0.05) / 32);
  const t = Math.sqrt(clamped);
  const tempC = -20 + t * 220;
  return tempC + 273;
}

/**
 * Compute initial speed for an atom given temperature and element mass.
 * speed = sqrt(2 * KE / mass), where KE = temperatureToKE(T).
 */
export function initialSpeed(temperature: number, mass: number): number {
  const ke = temperatureToKE(temperature);
  return Math.sqrt(2 * ke / mass);
}
