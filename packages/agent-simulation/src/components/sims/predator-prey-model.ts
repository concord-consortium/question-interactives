import * as AA from "@gjmcn/atomic-agents";

const sheepEnergy = 10;
const sheepEnergyFromGrass = 4;
const wolfEnergy = 10;
const wolfEnergyFromSheep = 20;

const maxGrassLevel = 10;
const grassGrowthRate = 0.01;

export const sim = new AA.Simulation({
  width: 450,
  height: 450,
  gridStep: 10
});

// set up squares (patches)
for (let x = 0; x < sim.width / sim.gridStep; x++) {
  for (let y = 0; y < sim.height / sim.gridStep; y++) {
    const square = sim.squareAt(x, y);
    square.zIndex = -Infinity;

    // Set initial grass level
    const grassLevel = Math.random() > .5 ? maxGrassLevel : Math.random() * maxGrassLevel;
    square.state = { grassLevel };

    // Color squares based on grass level
    square.vis({
      tint: (s: any) => s.state.grassLevel === maxGrassLevel ? "0x00ff00" : "0x996600"
    });

    // Grow grass at every tick
    square.updateState = () => {
      if (square.state.grassLevel < maxGrassLevel) {
        square.state.grassLevel = Math.min(maxGrassLevel, square.state.grassLevel + grassGrowthRate);
      }
    };
  }
}

// sheep
sim.populate({
  n: 50,
  radius: 3,
  setup: (ac: any) => {
    ac.vel = AA.Vector.randomAngle(1);
    ac.vis({ tint: "0xffffff" });
    ac.label("sheep", true);
    ac.state = { energy: sheepEnergy };
    ac.updateState = () => {
      // Eat grass
      const sq = ac.squareOfCentroid();
      if (sq.state.grassLevel >= maxGrassLevel) {
        // sheep eats grass
        ac.state.energy = ac.state.energy + sheepEnergyFromGrass;
        sq.state.grassLevel = 0;
      }

      // Lose energy and possibly die
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
    ac.vis({ tint: "0x333333" });
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
    w.state.energy = w.state.energy + wolfEnergyFromSheep;
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
