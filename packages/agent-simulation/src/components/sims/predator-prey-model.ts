import * as AA from "@gjmcn/atomic-agents";

export const sim = new AA.Simulation({
  width: 600,
  height: 400,
  gridStep: 25
});

// circles
sim.populate({
  n: 200,
  radius: 4,
  setup: (ac: any) => ac.vel = AA.Vector.randomAngle(2)
});

// circles bounce off each other
sim.interaction.set('circle-bounce', {
  group1: sim.actors,
  behavior: 'bounce',
  speed: 2  // fixed speed circles
});

// circles bounce off the simulation boundary
sim.interaction.set('boundary-bounce', {
  group1: sim,
  group2: sim.actors,
  behavior: 'bounce'
});
