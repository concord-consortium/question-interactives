import * as AA from "@gjmcn/atomic-agents";

export class AgentSimulation {
  sim: AA.Simulation;

  constructor(gridWidth: number, gridHeight: number, gridStep: number) {
    this.sim = new AA.Simulation({
      width: gridWidth,
      height: gridHeight,
      gridStep: gridStep
    });
  }

  destroy() {
    this.sim.end();
  }
}