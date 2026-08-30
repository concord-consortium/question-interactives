import * as AA from "@gjmcn/atomic-agents";
import { makeAutoObservable } from "mobx";

import { AtomState, MoleculeTemplate } from "../types/chemistry";
import { IWidgetProps } from "../types/widgets";
import "../widgets/register-widgets";
import { Globals } from "./globals";
import { ChemistryEngine } from "./chemistry-engine";
import {
  atomSvgDataUri, CH4_TEMPLATE, ELEMENTS, EL_C, EL_CL, EL_H, EL_O,
} from "./element-data";
import {
  computeAverageKE, initialSpeed, keToTemperature, setTemperature, temperatureToKE,
} from "../utils/physics-utils";

export interface SimulationConfig {
  width: number;
  height: number;
  gridStep: number;
  initialH: number;
  initialO: number;
  initialCl: number;
  initialCH4: number;
  initialTemperature: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  width: 300,
  height: 300,
  gridStep: 10,
  initialH: 15,
  initialO: 8,
  initialCl: 4,
  initialCH4: 3,
  initialTemperature: 25,
};

/**
 * Orchestrates the bonding simulation: manages atoms, the chemistry engine,
 * globals for widget binding, and the simulation tick loop.
 */
export class BondingSimulation {
  globals: Globals = new Globals();
  sim: AA.Simulation;
  widgets: IWidgetProps[] = [];
  chemistryEngine: ChemistryEngine = new ChemistryEngine();
  atoms: AA.Actor[] = [];
  config: SimulationConfig;
  private nextAtomId = 0;

  constructor(config?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sim = new AA.Simulation({
      width: this.config.width,
      height: this.config.height,
      gridStep: this.config.gridStep,
    });
    makeAutoObservable(this);
    this.registerWidgets();
    this.initialize();
  }

  addWidget(widget: IWidgetProps) {
    const { defaultValue, globalKey } = widget;
    if (defaultValue !== undefined && this.globals.get(globalKey) === undefined) {
      this.globals.set(globalKey, defaultValue);
    }
    this.widgets.push(widget);
  }

  /** Register all interactive widgets (sliders, readouts). */
  private registerWidgets() {
    this.addWidget({
      type: "slider", globalKey: "numH",
      defaultValue: this.config.initialH,
      data: { label: "Hydrogen (H)", icon: atomSvgDataUri(EL_H), min: 0, max: 50, step: 1, showReadout: true },
    });
    this.addWidget({
      type: "slider", globalKey: "numO",
      defaultValue: this.config.initialO,
      data: { label: "Oxygen (O)", icon: atomSvgDataUri(EL_O), min: 0, max: 25, step: 1, showReadout: true },
    });
    this.addWidget({
      type: "slider", globalKey: "numCl",
      defaultValue: this.config.initialCl,
      data: { label: "Chlorine (Cl)", icon: atomSvgDataUri(EL_CL), min: 0, max: 25, step: 1, showReadout: true },
    });
    this.addWidget({
      type: "slider", globalKey: "numCH4",
      defaultValue: this.config.initialCH4,
      data: { label: "Fuel (CH₄)", icon: atomSvgDataUri(EL_C), min: 0, max: 10, step: 1, showReadout: true },
    });
    this.addWidget({
      type: "slider", globalKey: "temperature",
      defaultValue: this.config.initialTemperature,
      data: { label: "Temperature (°C)", min: -20, max: 200, step: 5, showReadout: true },
    });
    this.addWidget({
      type: "readout", globalKey: "percentBonded",
      defaultValue: 0,
      data: { label: "% Atoms Bonded", formatType: "percent" },
    });
    this.addWidget({
      type: "readout", globalKey: "moleculeCount",
      defaultValue: 0,
      data: { label: "Molecules", formatType: "integer" },
    });
    this.addWidget({
      type: "readout", globalKey: "currentTemp",
      defaultValue: this.config.initialTemperature,
      data: { label: "Actual Temp (°C)", formatType: "integer" },
    });
  }

  /** Create atoms and set initial conditions. */
  initialize() {
    // Clear previous state
    this.atoms = [];
    this.nextAtomId = 0;
    this.chemistryEngine.reset();
    if (this.sim.actors) {
      this.sim.actors.forEach((a: AA.Actor) => a.remove?.());
    }

    const numH = (this.globals.get("numH") as number) ?? this.config.initialH;
    const numO = (this.globals.get("numO") as number) ?? this.config.initialO;
    const numCl = (this.globals.get("numCl") as number) ?? this.config.initialCl;
    const numCH4 = (this.globals.get("numCH4") as number) ?? this.config.initialCH4;
    const temp = (this.globals.get("temperature") as number) ?? this.config.initialTemperature;

    // Spawn individual atoms
    this.spawnAtoms(EL_H, numH, temp);
    this.spawnAtoms(EL_O, numO, temp);
    this.spawnAtoms(EL_CL, numCl, temp);

    // Spawn CH₄ fuel molecules
    for (let i = 0; i < numCH4; i++) {
      this.spawnMolecule(CH4_TEMPLATE, temp);
    }

    // Boundary bounce: atoms bounce off chamber walls
    this.sim.interaction?.set?.("boundary-bounce", {
      group1: this.sim,
      group2: this.sim.actors,
      behavior: "bounce",
    });

    // Atom-atom elastic collisions: atoms bounce off each other
    this.sim.interaction?.set?.("atom-collide", {
      group1: this.sim.actors,
      group2: this.sim.actors,
      behavior: "bounce",
    });

    this.chemistryEngine.setAtoms(this.atoms);
    this.updateGlobals();
  }

  /** Spawn n atoms of a given element with random positions and velocities. */
  private spawnAtoms(elementIndex: number, count: number, temperature: number) {
    const el = ELEMENTS[elementIndex];
    const margin = el.radius * 2;
    const speed = initialSpeed(temperature, el.mass);

    for (let i = 0; i < count; i++) {
      const atom = this.createAtom(
        elementIndex,
        margin + Math.random() * (this.config.width - 2 * margin),
        margin + Math.random() * (this.config.height - 2 * margin),
        speed,
      );
      this.atoms.push(atom);
    }
  }

  /** Spawn a pre-bonded molecule from a template. */
  private spawnMolecule(template: MoleculeTemplate, temperature: number) {
    const margin = 20;
    const cx = margin + Math.random() * (this.config.width - 2 * margin);
    const cy = margin + Math.random() * (this.config.height - 2 * margin);

    // Shared velocity for the whole molecule (moves as a unit initially)
    const avgMass = template.atoms.reduce((sum, a) => sum + ELEMENTS[a.elementIndex].mass, 0) / template.atoms.length;
    const speed = initialSpeed(temperature, avgMass);

    const moleculeAtoms: AA.Actor[] = [];
    for (const atomDef of template.atoms) {
      const atom = this.createAtom(
        atomDef.elementIndex,
        cx + atomDef.offsetX,
        cy + atomDef.offsetY,
        speed,
      );
      this.atoms.push(atom);
      moleculeAtoms.push(atom);
    }

    // Create pre-existing bonds
    for (const bondDef of template.bonds) {
      this.chemistryEngine.addBond(
        moleculeAtoms[bondDef.from],
        moleculeAtoms[bondDef.to],
        bondDef.type,
      );
    }
  }

  /** Create a single atom actor and add it to the simulation. */
  private createAtom(elementIndex: number, x: number, y: number, speed: number): AA.Actor {
    const el = ELEMENTS[elementIndex];
    const atom = new AA.Actor();
    atom.id = this.nextAtomId++;
    atom.x = x;
    atom.y = y;
    atom.radius = el.radius;
    // Use vel (Vector) for movement — this is what atomic-agents uses internally
    atom.vel = AA.Vector.randomAngle(speed);
    atom.state = {
      elementIndex,
      sharedElectrons: 0,
      bondIds: [],
    } as AtomState;
    atom.vis?.({ image: atomSvgDataUri(elementIndex) });
    atom.addTo?.(this.sim);
    return atom;
  }

  /**
   * Called every tick in the afterTick hook.
   * Runs physics, chemistry, and updates observable globals.
   */
  tick() {
    // Apply temperature control per-atom (slider is °C, convert to K for KE calc)
    const tempC = (this.globals.get("temperature") as number) ?? 25;
    const targetKE = temperatureToKE(tempC + 273);
    setTemperature(this.atoms, targetKE);

    // Run chemistry engine
    this.chemistryEngine.update(this.atoms);

    // Update globals for readout widgets
    this.updateGlobals();
  }

  /** Update observable globals from current simulation state. */
  private updateGlobals() {
    const bondedCount = this.chemistryEngine.getBondedAtomCount();
    const totalAtoms = this.atoms.length;
    this.globals.set("percentBonded", totalAtoms > 0 ? bondedCount / totalAtoms : 0);
    this.globals.set("moleculeCount", this.chemistryEngine.getMoleculeCount());
    this.globals.set("currentTemp", Math.round(keToTemperature(computeAverageKE(this.atoms)) - 273));
  }

  /** Reset simulation with current slider values. */
  reset() {
    this.initialize();
  }

  destroy() {
    this.sim.end?.();
  }
}
