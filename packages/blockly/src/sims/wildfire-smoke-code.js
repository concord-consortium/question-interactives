// import * as AA from "agent-based-automation";

// const sim = new AA.Simulation({
//   width: 600,
//   height: 400,
//   gridStep: 20
// });

let windSpeed = 2;
let windDirection = 0;

// const sheepEnergy = 6;
// const sheepEnergyFromGrass = 3;
// const sheepReproduceChance = 0.002;
// const sheepEnergyLoss = 0.01;

// const wolfEnergy = 20;
// const wolfReproduceChance = 0.0005;
// const wolfEnergyLoss = 0.1;

// const maxGrassLevel = 10;
// const grassGrowthRate = 0.01;

function setup() {
  blockly_create_air(1000);
}

sim.beforeTick = () => {
  sim.actors.forEach(agent => {
    const speed = getSpeedNumber(agent.state.speed);
    const heading = getHeadingNumber(agent);
    agent.vel = AA.Vector.fromPolar(speed, heading);
  });

  // Smoke is removed when it reaches a boundary
  sim.withLabel("smoke").forEach(agent => {
    if (agent.x < 0 || agent.x > sim.width || agent.y < 0 || agent.y > sim.height) {
      agent.remove();
    }
  });

  // Air wraps when it reaches a boundary
  sim.withLabel("air").forEach(agent => {
    if (agent.x < 0) {
      agent.x = sim.width - 1;
    } else if (agent.x > sim.width) {
      agent.x = 1;
    }
    if (agent.y < 0) {
      agent.y = sim.height - 1;
    } else if (agent.y > sim.height) {
      agent.y = 1;
    }
  });

  // Update heading and speed for particles affected by wind
  sim.actors.forEach(agent => {
    if (agent.state.heading === "wind direction") setHeading(agent, "wind direction");
    if (agent.state.speed === "wind speed")setSpeed(agent, "wind speed");
  });
}

sim.afterTick = () => {
  blockly_create_smoke(2);

  // Air particles are affected by wind
  sim.withLabel("air").forEach(agent => {
    setHeading(agent, "wind direction");
    setSpeed(agent, "wind speed");
  });
//   sim.squares.forEach(square => {
//     // Grow grass
//     if (square.state.grassLevel < maxGrassLevel) {
//       square.state.grassLevel = Math.min(maxGrassLevel, square.state.grassLevel + grassGrowthRate);
//     }
//   });

//   sim.actors?.forEach(a => {
//     // Lose energy and possibly die
//     const energyLoss = a.label("sheep") ? sheepEnergyLoss : wolfEnergyLoss;
//     a.state.energy = a.state.energy - energyLoss;
//     if (a.state.energy <= 0) {
//       a.remove();
//       return;
//     }

//     // Turn
//     a.vel.turn(Math.random() * Math.PI / 4 - Math.PI / 8);

//     // Reproduce
//     const reproduceChance = a.label("sheep") ? sheepReproduceChance : wolfReproduceChance;
//     if (Math.random() < reproduceChance) {
//       const addFunction = a.label("sheep") ? create_a_sheep : create_a_wolf;
//       // const color = a.label("sheep") ? sheepColor : wolfColor;
//       addFunction({ energy: a.state.energy / 2, x: a.x, y: a.y });
//       a.state.energy = a.state.energy / 2;
//     }
//   });

//   sim.withLabel("sheep").forEach(s => {
//     // Eat grass
//     const sq = s.squareOfCentroid();
//     if (sq.state.grassLevel >= maxGrassLevel) {
//       s.state.energy = s.state.energy + sheepEnergyFromGrass;
//       sq.state.grassLevel = 0;
//     }
//   });

//   sim.withLabel("wolf").forEach(w => {
//     // Eat sheep
//     const s = w.overlapping("actor").find(a => a?.label("sheep"));
//     if (s) {
//       w.state.energy = w.state.energy + s.state.energy / 2;
//       s.remove();
//     }
//   });

//   console.log(`sheep: ${Array.from(sim.withLabel("sheep")).length}, wolves: ${Array.from(sim.withLabel("wolf")).length}`);
};

// set up squares (patches)
for (let x = 0; x < sim.width / sim.gridStep; x++) {
  for (let y = 0; y < sim.height / sim.gridStep; y++) {
    const square = sim.squareAt(x, y);
    square.zIndex = -Infinity;

    square.vis({ tint: "0x99cc77" });

    // // Set initial grass level
    // const grassLevel = Math.random() > .5 ? maxGrassLevel : Math.random() * maxGrassLevel;
    // square.state = { grassLevel };

    // // Color squares based on grass level
    // square.vis({ tint: s => s.state.grassLevel === maxGrassLevel ? "0x00cc00" : "0x996600" });
  }
}

const colorMap = {
  "red": "0xff0000",
  "green": "0x00ff00",
  "blue": "0x0000ff",
  "gray": "0x999999",
  "white": "0xffffff",
  "cyan": "0x22bbff"
}
function colorFunction(agent) {
  return colorMap[agent.state.colorString] || "0x000000";
}
function getAddActorFunction(defaults) {
  return (props) => {
    const { energy, x, y } = props ?? {};
    const agent = new AA.Actor();
    agent.radius = defaults.radius;
    agent.vel = AA.Vector.randomAngle(defaults.velocity);
    agent.vis({ tint: colorFunction });
    agent.label(defaults.label, true);
    agent.state = { energy: energy ?? defaults.energy };
    agent.x = x ?? Math.random() * sim.width;
    agent.y = y ?? Math.random() * sim.height;

    agent.addTo(sim);
    return agent;
  };
}

function getSpeedNumber(speedString) {
  if (speedString === "zero") return 0;
  if (speedString === "very low") return 0.1;
  if (speedString === "low") return 0.25;
  if (speedString === "medium") return 0.5;
  if (speedString === "high") return 1;
  if (speedString === "wind speed") return windSpeed;

  return 0;
}
function setSpeed(agent, speedString) {
  agent.state.speed = speedString;
  agent.vel.setMag(getSpeedNumber(speedString));
}

function setPosition(agent, positionString) {
  if (positionString === "random") {
    agent.x = Math.random() * sim.width;
    agent.y = Math.random() * sim.height;
  } else if (positionString === "center") {
    agent.x = sim.width / 2;
    agent.y = sim.height / 2;
  }
  // TODO: handle horizontal and vertical lines
}

function getHeadingNumber(agent) {
  if (typeof agent.state.heading === "number") {
    return agent.state.heading;
  } else if (agent.state.heading === "wind direction") {
    return windDirection;
  }
}
function setHeading(agent, headingString) {
  if (headingString === "random") {
    agent.state.heading = Math.random() * 2 * Math.PI;
  } else if (headingString === "up") {
    agent.state.heading = 3 * Math.PI / 2;
  } else if (headingString === "down") {
    agent.state.heading = Math.PI / 2;
  } else if (headingString === "left") {
    agent.state.heading = Math.PI;
  } else if (headingString === "right") {
    agent.state.heading = 0;
  } else if (headingString === "wind direction") {
    agent.state.heading = "wind direction";
  }

  agent.vel.setHeading(getHeadingNumber(agent));
}

function setMass(agent, massString) {
  if (massString === "light") {
    agent.state.mass = 0.5;
  } else if (massString === "medium") {
    agent.state.mass = 1;
  } else if (massString === "heavy") {
    agent.state.mass = 2;
  }
}

function setColor(agent, colorString) {
  agent.state.colorString = colorString;
}

// air
const create_a_air = getAddActorFunction({
  label: "air",
  radius: 2
});
function create_air(num, callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_air();
    if (callback) callback(agent);
  }
}
function blockly_create_air(num) {
  create_air(num, agent => {
    setSpeed(agent, "wind speed");
    setPosition(agent, "random");
    setHeading(agent, "random");
    setMass(agent, "medium");
    setColor(agent, "cyan");
  });
}

// smoke
const create_a_smoke = getAddActorFunction({
  label: "smoke",
  radius: 4
});
function create_smoke(num, callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_smoke();
    if (callback) callback(agent);
  }
}
function blockly_create_smoke(num) {
  create_smoke(num, agent => {
    setSpeed(agent, "very low");
    setPosition(agent, "center");
    setHeading(agent, "random");
    setMass(agent, "medium");
    setColor(agent, "gray");
  })
}

// actors bounce off the simulation boundary
sim.interaction.set("boundary-bounce", {
  group1: sim.actors,
  group2: sim.actors,
  behavior: "bounce"
});

setup();

