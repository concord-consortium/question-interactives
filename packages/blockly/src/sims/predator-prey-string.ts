// This file contains vanilla javascript code that runs the predator-prey simulation when included as simulation code.
// It is used as the simulation code for the default and demo authored state.

export const predatorPreyCode = `
const sheepSvg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- Circles (color -1 -> #FFFFFF) -->
  <circle cx="247" cy="109" r="44" fill="#FFFFFF" stroke="#FFFFFF" />
  <circle cx="151" cy="146" r="81" fill="#FFFFFF" stroke="#FFFFFF" />
  <circle cx="210" cy="165" r="60" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Polygon (color -7500403 -> #8D8D8D), filled no stroke -->
  <polygon
    points="218,120 240,165 255,165 278,120"
    fill="#8D8D8D" stroke="none"
  />

  <!-- Circle (ear) -->
  <circle cx="247.5" cy="105.5" r="33.5" fill="#8D8D8D" stroke="none" />

  <!-- Rectangles (legs) -->
  <rect x="164" y="223" width="15" height="75" fill="#FFFFFF" stroke="#FFFFFF" />
  <rect x="65"  y="221" width="15" height="75" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Polygons (legs) -->
  <polygon
    points="45,285 30,285 30,240 15,195 45,210"
    fill="#FFFFFF" stroke="#FFFFFF"
  />
  <polygon
    points="195,285 210,285 210,240 240,210 195,210"
    fill="#FFFFFF" stroke="#FFFFFF"
  />

  <!-- Large body circle -->
  <circle cx="78" cy="158" r="75" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Small head/ear polygons -->
  <polygon
    points="276,85 285,105 302,99 294,83"
    fill="#8D8D8D" stroke="none"
  />
  <polygon
    points="219,85 210,105 193,99 201,83"
    fill="#8D8D8D" stroke="none"
  />
</svg>
\`;

const wolfSvg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- Polygon -16777216 true false -->
  <!-- color = #000000 (black), filled, no stroke -->
  <polygon
    points="253,133 245,131 245,133"
    fill="#000000"
    stroke="none"
  />

  <!-- Polygon -7500403 true true -->
  <!-- color = #8D8D8D (gray), filled + stroked -->
  <polygon
    points="2,194 13,197 30,191 38,193 38,205 20,226 20,257 27,265 38,266 40,260 31,253 31,230 60,206 68,198 75,209 66,228 65,243 82,261 84,268 100,267 103,261 77,239 79,231 100,207 98,196 119,201 143,202 160,195 166,210 172,213 173,238 167,251 160,248 154,265 169,264 178,247 186,240 198,260 200,271 217,271 219,262 207,258 195,230 192,198 210,184 227,164 242,144 259,145 284,151 277,141 293,140 299,134 297,127 273,119 270,105"
    fill="#8D8D8D"
    stroke="#8D8D8D"
    stroke-width="1"
    stroke-linejoin="round"
  />

  <!-- Polygon -7500403 true true -->
  <!-- color = #8D8D8D (gray), filled + stroked -->
  <polygon
    points="-1,195 14,180 36,166 40,153 53,140 82,131 134,133 159,126 188,115 227,108 236,102 238,98 268,86 269,92 281,87 269,103 269,113"
    fill="#8D8D8D"
    stroke="#8D8D8D"
    stroke-width="1"
    stroke-linejoin="round"
  />
</svg>
\`;

const encodeSvg = (svg) => \`data:image/svg+xml;charset=utf-8,\${encodeURIComponent(svg)}\`;
const wolfImage = encodeSvg(wolfSvg);
const sheepImage = encodeSvg(sheepSvg);

const sheepEnergy = 6;
const sheepReproduceChance = 0.002;
const sheepEnergyLoss = 0.01;

const wolfEnergy = 20;
const wolfReproduceChance = 0.0005;
const wolfEnergyLoss = 0.1;

const maxGrassLevel = 10;
const grassGrowthRate = 0.01;

// Create widgets
addWidget({
  data: {
    label: "Sheep Energy from Grass",
    min: 1,
    max: 50
  },
  defaultValue: 3,
  globalKey: "sheepEnergyFromGrass",
  type: "slider"
});
addWidget({
  data: {
    label: "Sheep Energy from Grass"
  },
  globalKey: "sheepEnergyFromGrass",
  type: "readout"
});
addWidget({
  data: {
    label: "Sheep"
  },
  defaultValue: 0,
  globalKey: "sheepCount",
  type: "readout"
});
addWidget({
  data: {
    backgroundColor: "#666",
    color: "#fff",
    label: "Wolves"
  },
  defaultValue: 0,
  globalKey: "wolfCount",
  type: "readout"
});

function setup() {
  create_sheep(50);
  create_wolves(10);
}

sim.beforeTick = () => {
  // Execute queued onClick actions. We handle mouse clicks here because
  // Atomic Agents Vis can't handle adding/removing agents outside of a tick function.
  if (onClickPendingEvent) {
    onClick(onClickPendingEvent);
    onClickPendingEvent = undefined;
  }
}

sim.afterTick = () => {
  sim.squares.forEach(square => {
    // Grow grass
    if (square.state.grassLevel < maxGrassLevel) {
      square.state.grassLevel = Math.min(maxGrassLevel, square.state.grassLevel + grassGrowthRate);
    }
  });

  sim.actors?.forEach(a => {
    // Lose energy and possibly die
    const energyLoss = a.label("sheep") ? sheepEnergyLoss : wolfEnergyLoss;
    a.state.energy = a.state.energy - energyLoss;
    if (a.state.energy <= 0) {
      const globalKey = a.label("sheep") ? "sheepCount" : "wolfCount";
      globals.set(globalKey, globals.get(globalKey) - 1);
      a.remove();
      return;
    }

    // Turn
    a.vel.turn(Math.random() * Math.PI / 4 - Math.PI / 8);

    // Reproduce
    const reproduceChance = a.label("sheep") ? sheepReproduceChance : wolfReproduceChance;
    if (Math.random() < reproduceChance) {
      const addFunction = a.label("sheep") ? create_a_sheep : create_a_wolf;
      addFunction({ energy: a.state.energy / 2, x: a.x, y: a.y });
      a.state.energy = a.state.energy / 2;
    }
  });

  sim.withLabel("sheep").forEach(s => {
    // Eat grass
    const sq = s.squareOfCentroid();
    if (sq.state.grassLevel >= maxGrassLevel) {
      s.state.energy = s.state.energy + globals.get("sheepEnergyFromGrass");
      sq.state.grassLevel = 0;
    }
  });

  sim.withLabel("wolves").forEach(w => {
    // Eat sheep
    const s = w.overlapping("actor").find(a => a?.label("sheep"));
    if (s) {
      w.state.energy = w.state.energy + s.state.energy / 2;
      s.remove();
      globals.set("sheepCount", globals.get("sheepCount") - 1);
    }
  });
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
    square.vis({ tint: s => s.state.grassLevel === maxGrassLevel ? "0x00cc00" : "0x996600" });
  }
}

// sheep
function create_a_sheep(props) {
  const { color, energy, x, y } = props ?? {};
  const agent = new AA.Actor();
  agent.radius = 10;
  agent.vel = AA.Vector.randomAngle(1);
  agent.vis({ image: sheepImage, tint: color });
  agent.label("sheep", true);
  agent.state = { energy: energy ?? sheepEnergy };
  agent.x = x ?? globals.get("mouseX") ?? Math.random() * sim.width;
  agent.y = y ?? globals.get("mouseY") ?? Math.random() * sim.height;

  agent.addTo(sim);
  globals.set("sheepCount", globals.get("sheepCount") + 1);
  return agent;
}
function create_sheep(num, callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_sheep();
    if (callback) callback(agent);
  }
}

// wolves
function create_a_wolf(props) {
  const { color, energy, x, y } = props ?? {};
  const agent = new AA.Actor();
  agent.radius = 10;
  agent.vel = AA.Vector.randomAngle(1.5);
  agent.vis({ image: wolfImage, tint: color ?? "0x333333" });
  agent.label("wolves", true);
  agent.state = { energy: energy ?? wolfEnergy };
  agent.x = x ?? globals.get("mouseX") ?? Math.random() * sim.width;
  agent.y = y ?? globals.get("mouseY") ?? Math.random() * sim.height;

  agent.addTo(sim);
  globals.set("wolfCount", globals.get("wolfCount") + 1);
  return agent;
};
function create_wolves(num, callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_wolf();
    if (callback) callback(agent);
  }
}

// actors bounce off the simulation boundary
sim.interaction.set("boundary-bounce", {
  group1: sim,
  group2: sim.actors,
  behavior: "bounce"
});

setup();

// Store onClick actions to be executed during the next tick
let onClickPendingEvent = undefined;

function _onClick(event) {
  globals.set("mouseX", event.data.global.x);
  globals.set("mouseY", event.data.global.y);
  onClickPendingEvent = event;
}

sim.vis({
  background: true,
  click: _onClick
});
`;
