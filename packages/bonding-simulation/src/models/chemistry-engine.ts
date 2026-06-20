import * as AA from "@gjmcn/atomic-agents";
import { AtomState, Bond } from "../types/chemistry";
import {
  BOND_STRENGTH, ELEMENTS, getActivationEnergy, getBondEnergy, getBondLength,
  getUnpairedElectrons, isRadical,
} from "./element-data";

/**
 * Simplified chemistry engine for the bonding simulation.
 *
 * Ported from lab's chemical-reactions.js plugin, with these simplifications:
 * - No Lennard-Jones potential (atoms move at constant speed between collisions)
 * - No angular bonds (no stereochemistry enforcement)
 * - No creationPotential tracking for LJ adjustment
 * - Energy is conserved approximately via KE redistribution on bond/break
 *
 * Called once per tick in the simulation's afterTick hook.
 */
export class ChemistryEngine {
  bonds: Bond[] = [];
  private nextBondId = 0;

  /** Map from atom actor ID to the Actor, for fast lookup. */
  private atomMap = new Map<number, AA.Actor>();

  /** Register atoms so the engine can look them up by ID. */
  setAtoms(atoms: AA.Actor[]) {
    this.atomMap.clear();
    for (const atom of atoms) {
      if (atom.id != null) this.atomMap.set(atom.id, atom);
    }
  }

  /** Add a pre-existing bond (e.g., from a molecule template). */
  addBond(atom1: AA.Actor, atom2: AA.Actor, type: 1 | 2 | 3): Bond {
    const s1 = atom1.state as AtomState;
    const s2 = atom2.state as AtomState;
    const el1 = s1.elementIndex;
    const el2 = s2.elementIndex;
    const bond: Bond = {
      id: this.nextBondId++,
      atom1Id: atom1.id ?? -1,
      atom2Id: atom2.id ?? -1,
      type,
      length: getBondLength(el1, el2),
      strength: BOND_STRENGTH,
      chemicalEnergy: getBondEnergy(el1, el2, type),
    };
    this.bonds.push(bond);
    s1.sharedElectrons += type;
    s2.sharedElectrons += type;
    s1.bondIds.push(bond.id);
    s2.bondIds.push(bond.id);
    return bond;
  }

  /** Remove a bond and update atom states. */
  private removeBond(bond: Bond) {
    const a1 = this.atomMap.get(bond.atom1Id);
    const a2 = this.atomMap.get(bond.atom2Id);
    if (a1) {
      const s1 = a1.state as AtomState;
      s1.sharedElectrons -= bond.type;
      s1.bondIds = s1.bondIds.filter(id => id !== bond.id);
    }
    if (a2) {
      const s2 = a2.state as AtomState;
      s2.sharedElectrons -= bond.type;
      s2.bondIds = s2.bondIds.filter(id => id !== bond.id);
    }
    this.bonds = this.bonds.filter(b => b.id !== bond.id);
  }

  /** Run one tick of chemistry: break bonds, try exchanges, form new bonds. */
  update(atoms: AA.Actor[]) {
    this.setAtoms(atoms);
    this.tryBreakBonds();
    this.tryExchangeBonds(atoms);
    this.tryFormBonds(atoms);
    this.applyBondConstraints();
  }

  /**
   * Break bonds whose strain exceeds their chemical energy.
   * Strain = 0.5 * strength * (distance - equilibrium)²
   */
  private tryBreakBonds() {
    const toBreak: Bond[] = [];
    for (const bond of this.bonds) {
      const a1 = this.atomMap.get(bond.atom1Id);
      const a2 = this.atomMap.get(bond.atom2Id);
      if (!a1 || !a2) { toBreak.push(bond); continue; }

      const dx = a2.x - a1.x;
      const dy = a2.y - a1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const displacement = dist - bond.length;
      const strain = 0.5 * bond.strength * displacement * displacement;

      if (strain > bond.chemicalEnergy) {
        toBreak.push(bond);
        // Release bond energy as KE — speed up both atoms
        this.addKEToAtoms(a1, a2, bond.chemicalEnergy);
      }
    }
    for (const bond of toBreak) {
      this.removeBond(bond);
    }
  }

  /**
   * Try to form bonds between colliding radical atoms.
   * Two atoms bond when:
   * 1. They overlap (distance < r1 + r2)
   * 2. At least one is a radical
   * 3. No common bonded neighbors (prevents triangles)
   */
  private tryFormBonds(atoms: AA.Actor[]) {
    for (let i = 0; i < atoms.length; i++) {
      const a1 = atoms[i];
      const s1 = a1.state as AtomState;
      if (!isRadical(s1)) continue;

      for (let j = i + 1; j < atoms.length; j++) {
        const a2 = atoms[j];
        const s2 = a2.state as AtomState;

        // Both must be radicals (have bonding capacity)
        if (!isRadical(s2)) continue;

        // Check bonding distance — slightly larger than collision radius
        // so we catch atoms that just bounced off each other
        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        const distSq = dx * dx + dy * dy;
        const collisionDist = ELEMENTS[s1.elementIndex].radius + ELEMENTS[s2.elementIndex].radius;
        const bondingDist = collisionDist * 1.3; // 30% larger than contact distance
        if (distSq > bondingDist * bondingDist) continue;

        // Check no common bonded neighbors
        if (this.haveCommonNeighbor(s1, s2)) continue;

        // Check not already bonded to each other
        if (this.areBonded(a1.id ?? -1, a2.id ?? -1)) continue;

        // Determine bond type: use the highest type both atoms can support.
        // This ensures O+O forms a double bond (O=O), saturating both atoms,
        // rather than single bonds that leave capacity for unrealistic chains.
        const maxType = Math.min(
          getUnpairedElectrons(s1),
          getUnpairedElectrons(s2),
          3
        ) as 1 | 2 | 3;
        if (maxType < 1) continue;

        const bondType = maxType;

        const energy = getBondEnergy(s1.elementIndex, s2.elementIndex, bondType);
        // Minimum bond energy threshold: prevents very weak bonds (e.g. O-O single)
        // that create unrealistic chains. Only strong bonds form spontaneously.
        if (energy < 2.0) continue;

        // Form the bond
        this.addBond(a1, a2, bondType);

        // Absorb energy: slow down both atoms (bond formation releases energy
        // but we model it as the atoms losing KE to form the bond)
        this.removeKEFromAtoms(a1, a2, energy * 0.3);

        // Re-check s1 radical status before continuing inner loop
        if (!isRadical(s1)) break;
      }
    }
  }

  /**
   * Try bond exchange: a free radical near a bonded pair can swap the bond.
   * Radical A collides with bonded pair B-C → A-B + C (if energetically favorable).
   */
  private tryExchangeBonds(atoms: AA.Actor[]) {
    for (const atom of atoms) {
      const state = atom.state as AtomState;
      if (!isRadical(state)) continue;

      // Find nearby bonded atoms
      for (const bond of [...this.bonds]) {
        // Skip bonds this atom is part of
        if (bond.atom1Id === atom.id || bond.atom2Id === atom.id) continue;

        // Check if radical is near either end of the bond
        const a1 = this.atomMap.get(bond.atom1Id);
        const a2 = this.atomMap.get(bond.atom2Id);
        if (!a1 || !a2) continue;

        // Try exchanging with each end
        for (const [target, displaced] of [[a1, a2], [a2, a1]] as [AA.Actor, AA.Actor][]) {
          const dx = target.x - atom.x;
          const dy = target.y - atom.y;
          const distSq = dx * dx + dy * dy;
          const collisionDist = ELEMENTS[state.elementIndex].radius + ELEMENTS[(target.state as AtomState).elementIndex].radius;
          if (distSq > collisionDist * collisionDist) continue;

          // Calculate collision KE using reduced mass
          const m1 = ELEMENTS[state.elementIndex].mass;
          const m2 = ELEMENTS[(target.state as AtomState).elementIndex].mass;
          const reducedMass = (m1 * m2) / (m1 + m2);
          const dvx = (target.vel?.x ?? 0) - (atom.vel?.x ?? 0);
          const dvy = (target.vel?.y ?? 0) - (atom.vel?.y ?? 0);
          const collisionKE = 0.5 * reducedMass * (dvx * dvx + dvy * dvy);

          // Energy required for exchange
          const oldEnergy = bond.chemicalEnergy;
          const newEnergy = getBondEnergy(state.elementIndex, (target.state as AtomState).elementIndex, 1);
          const activationE = getActivationEnergy(state.elementIndex, (target.state as AtomState).elementIndex);
          const requiredEnergy = newEnergy >= oldEnergy
            ? activationE
            : activationE + (oldEnergy - newEnergy);

          if (collisionKE < requiredEnergy) continue;

          // Perform exchange: remove old bond, create new one
          this.removeBond(bond);
          this.addBond(atom, target, 1);

          // Energy difference goes to/from KE
          const energyDiff = newEnergy - oldEnergy;
          if (energyDiff > 0) {
            this.removeKEFromAtoms(atom, target, energyDiff * 0.3);
          } else {
            this.addKEToAtoms(atom, displaced, -energyDiff * 0.3);
          }
          break; // Only one exchange per radical per tick
        }
      }
    }
  }

  /**
   * Apply bond constraints: nudge bonded atoms toward equilibrium length
   * and synchronize their velocities so molecules move as a unit.
   */
  private applyBondConstraints() {
    const relaxation = 0.3;

    for (const bond of this.bonds) {
      const a1 = this.atomMap.get(bond.atom1Id);
      const a2 = this.atomMap.get(bond.atom2Id);
      if (!a1 || !a2) continue;

      const dx = a2.x - a1.x;
      const dy = a2.y - a1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) continue;

      const error = dist - bond.length;
      const correction = (error * relaxation) / dist;

      const m1 = ELEMENTS[(a1.state as AtomState).elementIndex].mass;
      const m2 = ELEMENTS[(a2.state as AtomState).elementIndex].mass;
      const totalMass = m1 + m2;

      // Nudge positions toward equilibrium
      a1.x += dx * correction * (m2 / totalMass);
      a1.y += dy * correction * (m2 / totalMass);
      a2.x -= dx * correction * (m1 / totalMass);
      a2.y -= dy * correction * (m1 / totalMass);

      // Synchronize velocities: bonded atoms share center-of-mass velocity
      // so molecules move as a unit instead of fighting each other
      const v1x = a1.vel?.x ?? 0;
      const v1y = a1.vel?.y ?? 0;
      const v2x = a2.vel?.x ?? 0;
      const v2y = a2.vel?.y ?? 0;
      const cmVx = (m1 * v1x + m2 * v2x) / totalMass;
      const cmVy = (m1 * v1y + m2 * v2y) / totalMass;
      const cmSpeed = Math.sqrt(cmVx * cmVx + cmVy * cmVy);
      if (cmSpeed > 0.001) {
        // Preserve individual speeds but align directions toward CM velocity
        const blend = 0.3; // how quickly atoms align (0=free, 1=rigid)
        const s1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const s2 = Math.sqrt(v2x * v2x + v2y * v2y);
        if (s1 > 0.001 && a1.vel) {
          const nx = v1x / s1 * (1 - blend) + cmVx / cmSpeed * blend;
          const ny = v1y / s1 * (1 - blend) + cmVy / cmSpeed * blend;
          const nlen = Math.sqrt(nx * nx + ny * ny);
          a1.vel = new AA.Vector(nx / nlen * s1, ny / nlen * s1);
        }
        if (s2 > 0.001 && a2.vel) {
          const nx = v2x / s2 * (1 - blend) + cmVx / cmSpeed * blend;
          const ny = v2y / s2 * (1 - blend) + cmVy / cmSpeed * blend;
          const nlen = Math.sqrt(nx * nx + ny * ny);
          a2.vel = new AA.Vector(nx / nlen * s2, ny / nlen * s2);
        }
      }
    }
  }

  /** Check if two atoms share a bonded neighbor (prevents triangle bonds). */
  private haveCommonNeighbor(s1: AtomState, s2: AtomState): boolean {
    const neighbors1 = new Set<number>();
    for (const bId of s1.bondIds) {
      const bond = this.bonds.find(b => b.id === bId);
      if (bond) {
        neighbors1.add(bond.atom1Id);
        neighbors1.add(bond.atom2Id);
      }
    }
    for (const bId of s2.bondIds) {
      const bond = this.bonds.find(b => b.id === bId);
      if (bond) {
        if (neighbors1.has(bond.atom1Id) || neighbors1.has(bond.atom2Id)) return true;
      }
    }
    return false;
  }

  /** Check if two atoms are already bonded to each other. */
  private areBonded(id1: number, id2: number): boolean {
    return this.bonds.some(b =>
      (b.atom1Id === id1 && b.atom2Id === id2) ||
      (b.atom1Id === id2 && b.atom2Id === id1)
    );
  }

  /** Add kinetic energy to two atoms (speed them up). */
  private addKEToAtoms(a1: AA.Actor, a2: AA.Actor, energy: number) {
    const m1 = ELEMENTS[(a1.state as AtomState).elementIndex].mass;
    const m2 = ELEMENTS[(a2.state as AtomState).elementIndex].mass;
    const share1 = energy * m2 / (m1 + m2); // lighter atom gets more speed
    const share2 = energy * m1 / (m1 + m2);
    this.scaleAtomSpeed(a1, share1, true);
    this.scaleAtomSpeed(a2, share2, true);
  }

  /** Remove kinetic energy from two atoms (slow them down). */
  private removeKEFromAtoms(a1: AA.Actor, a2: AA.Actor, energy: number) {
    const m1 = ELEMENTS[(a1.state as AtomState).elementIndex].mass;
    const m2 = ELEMENTS[(a2.state as AtomState).elementIndex].mass;
    const share1 = energy * m2 / (m1 + m2);
    const share2 = energy * m1 / (m1 + m2);
    this.scaleAtomSpeed(a1, share1, false);
    this.scaleAtomSpeed(a2, share2, false);
  }

  /** Adjust an atom's speed by adding or removing KE. */
  private scaleAtomSpeed(atom: AA.Actor, deltaKE: number, add: boolean) {
    const vx = atom.vel?.x ?? 0;
    const vy = atom.vel?.y ?? 0;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.001) return;

    const mass = ELEMENTS[(atom.state as AtomState).elementIndex].mass;
    const currentKE = 0.5 * mass * speed * speed;
    const newKE = add ? currentKE + deltaKE : Math.max(0.01, currentKE - deltaKE);
    const newSpeed = Math.sqrt(2 * newKE / mass);
    const ratio = newSpeed / speed;
    if (atom.vel) {
      atom.vel = atom.vel.copy().mult(ratio);
    }
  }

  /** Reset the engine, clearing all bonds. */
  reset() {
    this.bonds = [];
    this.nextBondId = 0;
    this.atomMap.clear();
  }

  /** Get the number of atoms that have at least one bond. */
  getBondedAtomCount(): number {
    const bonded = new Set<number>();
    for (const bond of this.bonds) {
      bonded.add(bond.atom1Id);
      bonded.add(bond.atom2Id);
    }
    return bonded.size;
  }

  /** Get the number of distinct molecules (connected components via bonds). */
  getMoleculeCount(): number {
    if (this.bonds.length === 0) return 0;
    const parent = new Map<number, number>();
    const find = (x: number): number => {
      if (!parent.has(x)) parent.set(x, x);
      const px = parent.get(x) ?? x;
      if (px !== x) parent.set(x, find(px));
      return parent.get(x) ?? x;
    };
    const union = (a: number, b: number) => {
      parent.set(find(a), find(b));
    };
    for (const bond of this.bonds) {
      union(bond.atom1Id, bond.atom2Id);
    }
    const roots = new Set<number>();
    for (const bond of this.bonds) {
      roots.add(find(bond.atom1Id));
    }
    return roots.size;
  }
}
