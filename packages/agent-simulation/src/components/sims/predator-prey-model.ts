import * as AA from "@gjmcn/atomic-agents";

const sheepEnergy = 6;
const sheepEnergyFromGrass = 3;
const sheepReproduceChance = 0.002;
const sheepEnergyLoss = 0.01;
const sheepColor = "0xffffff";

const wolfEnergy = 20;
// const wolfEnergyFromSheep = 5;
const wolfReproduceChance = 0.0005;
const wolfEnergyLoss = 0.1;
const wolfColor = "0x333333";

const maxGrassLevel = 10;
const grassGrowthRate = 0.01;

export const sim = new AA.Simulation({
  width: 450,
  height: 450,
  gridStep: 10
});

function setup() {
  /*** From setup block */
  addMultipleSheep(50);
  addWolves(10);
  /*** End setup block */
}

sim.afterTick = () => {
  /*** From go block */
  sim.actors?.forEach((a: any) => {
    // Lose energy and possibly die
    const energyLoss = a.label("sheep") ? sheepEnergyLoss : wolfEnergyLoss;
    a.state.energy = a.state.energy - energyLoss;
    if (a.state.energy <= 0) {
      a.remove();
      return;
    }

    // Turn
    a.vel.turn(Math.random() * Math.PI / 4 - Math.PI / 8);

    // Reproduce
    const reproduceChance = a.label("sheep") ? sheepReproduceChance : wolfReproduceChance;
    if (Math.random() < reproduceChance) {
      const addFunction = a.label("sheep") ? addSheep : addWolf;
      const color = a.label("sheep") ? sheepColor : wolfColor;
      addFunction({ color, energy: a.state.energy / 2, x: a.x, y: a.y });
      a.state.energy = a.state.energy / 2;
    }
  });

  sheep.forEach((s: any) => {
    // Eat grass
    const sq = s.squareOfCentroid();
    if (sq.state.grassLevel >= maxGrassLevel) {
      s.state.energy = s.state.energy + sheepEnergyFromGrass;
      sq.state.grassLevel = 0;
    }
  });

  wolves.forEach((w: any) => {
    // Eat sheep
    const s = w.overlapping("actor").find((a: any) => a?.label("sheep"));
    if (s) {
      w.state.energy = w.state.energy + s.state.energy / 2;
      s.remove();
    }
  });
  /*** End go block */

  console.log(`sheep: ${Array.from(sim.withLabel("sheep")).length}, wolves: ${Array.from(sim.withLabel("wolf")).length}`);
};

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
      tint: (s: any) => s.state.grassLevel === maxGrassLevel ? "0x00cc00" : "0x996600"
    });

    // Grow grass at every tick
    square.updateState = () => {
      if (square.state.grassLevel < maxGrassLevel) {
        square.state.grassLevel = Math.min(maxGrassLevel, square.state.grassLevel + grassGrowthRate);
      }
    };
  }
}

interface IActorDefaults {
  color: string;
  energy: number;
  label: string;
  radius: number;
  velocity: number;
}
interface INewActor {
  color?: string;
  energy?: number;
  x?: number;
  y?: number;
}
function getAddActorFunction(defaults: IActorDefaults) {
  return (props?: INewActor) => {
    const { color, energy, x, y } = props ?? {};
    const a = new AA.Actor();
    a.radius = defaults.radius;
    a.vel = AA.Vector.randomAngle(defaults.velocity);
    a.vis({ tint: color ?? defaults.color });
    a.label(defaults.label, true);
    a.state = { energy: energy ?? defaults.energy };
    a.x = x ?? Math.random() * sim.width;
    a.y = y ?? Math.random() * sim.height;

    a.addTo(sim);
    return a;
  };
}

// sheep
const addSheep = getAddActorFunction({
  color: "0xffffff",
  energy: sheepEnergy,
  label: "sheep",
  radius: 3,
  velocity: 1
});
function addMultipleSheep(num: number) {
  for (let i = 0; i < num; i++) {
    addSheep();
  }
}

// wolves
const addWolf = getAddActorFunction({
  color: "0x333333",
  energy: wolfEnergy,
  label: "wolf",
  radius: 4,
  velocity: 1.5
});
function addWolves(num: number) {
  for (let i = 0; i < num; i++) {
    addWolf();
  }
}

// circles bounce off the simulation boundary
sim.interaction.set("boundary-bounce", {
  group1: sim,
  group2: sim.actors,
  behavior: "bounce"
});

setup();
const sheep = sim.withLabel("sheep");
const wolves = sim.withLabel("wolf");
