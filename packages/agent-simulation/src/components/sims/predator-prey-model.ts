import * as AA from "@gjmcn/atomic-agents";

const sheepEnergy = 10;
const wolfEnergy = 10;

export const sim = new AA.Simulation({
  width: 450,
  height: 450,
  gridStep: 25
});

// sheep
sim.populate({
  n: 50,
  radius: 3,
  setup: (ac: any) => {
    ac.vel = AA.Vector.randomAngle(1);
    ac.vis({
      tint: "0xffffff"
    });
    ac.label("sheep", true);
    ac.state = { energy: sheepEnergy };
    ac.updateState = () => {
      ac.state.energy = ac.state.energy - 0.01;
      if (ac.state.energy <= 0) {
        ac.remove();
      }
    };
  }
});
const sheep = sim.withLabel("sheep");

// wolves
sim.populate({
  n: 10,
  radius: 4,
  setup: (ac: any) => {
    ac.vel = AA.Vector.randomAngle(1.5);
    ac.vis({
      tint: "0x333333"
    });
    ac.label("wolf", true);
    ac.state = { energy: wolfEnergy };
    ac.updateState = () => {
      ac.state.energy = ac.state.energy - 0.01;
      if (ac.state.energy <= 0) {
        ac.remove();
      }
    };
  }
});
const wolves = sim.withLabel("wolf");

sim.interaction.set("wolf-eats-sheep", {
  group1: wolves,
  group2: sheep,
  behavior: "custom",
  force: (w: any, s: any) => {
    // wolf eats sheep
    w.state.energy = w.state.energy + sheepEnergy / 2;
    s.remove();
    return AA.Vector.randomAngle(1.5);
  }
});

// circles bounce off the simulation boundary
sim.interaction.set("boundary-bounce", {
  group1: sim,
  group2: sim.actors,
  behavior: "bounce"
});
