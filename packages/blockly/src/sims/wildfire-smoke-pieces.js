// This file contains the wildfire smoke simulation, broken into parts that can be entered into different parts
// of the blockly interactive interface.
// Note that some aspects of the MoDa simulation blocks cannot be replicated because our nested block setup
// does not allow an author to specify conditions for if blocks, non-default values in contained blocks, etc.

/*** Sim code */
let windSpeed = 1;
let windDirection = 0;

function isTouching(agent, type) {
  if (type === "wall") {
    return agent.x <= 0 || agent.x >= sim.width || agent.y <= 0 || agent.y >= sim.height;
  } else {
    const isMoving = agent.state.speed > 0;
    const _others = agent.overlapping("actor");
    const others = type === "any" ? _others : _others.filter(a => a.label(type));
    return others && others.some(a => isMoving || a.state.speed > 0);
  }
}

// Adapted from MoDa code
// https://github.com/tamarrf/MoDa_Dev/blob/master/src/web-application/public/wildfire-and-smoke-spread-v2.nlogo
function collide(actor1, actor2) {
  const s1 = actor1.state.speed;
  const s2 = actor2.state.speed;
  const h1 = actor1.state.heading;
  const h2 = actor2.state.heading;
  const m1 = actor1.state.mass ?? 1;
  const m2 = actor2.state.mass ?? 1;
  const theta = Math.random() * 2 * Math.PI;

  let v1t = s1 * Math.cos(theta - h1);
  const v1l = s1 * Math.sin(theta - h1);
  let v2t = s2 * Math.cos(theta - h2);
  const v2l = s2 * Math.sin(theta - h2);

  const vcm = (m1 * v1t + m2 * v2t) / (m1 + m2);
  v1t = 2 * vcm - v1t;
  v2t = 2 * vcm - v2t;

  actor1.state.speed = Math.sqrt(v1t * v1t + v1l * v1l);
  if (v1t !== 0 || v1l !== 0) {
    actor1.state.heading = theta - Math.atan2(v1l, v1t);
  }

  actor2.state.speed = Math.sqrt(v2t * v2t + v2l * v2l);
  if (v2t !== 0 || v2l !== 0) {
    actor2.state.heading = theta - Math.atan2(v2l, v2t);
  }
}

function attach(actor1, actor2) {
  actor1.state.speed = actor2.state.speed;
  actor1.state.heading = actor2.state.heading;
}

function interact(agent, interactFunction) {
  if (agent.state.collided) return;

  const agentMoving = agent.state.speed > 0;
  const others = agent.overlapping("actor");
  if (others) {
    const other = others.find(a => {
      return !a.state.collided && a.state.lastCollision !== agent && agent.state.lastCollision !== a &&
        (agentMoving || a.state.speed > 0);
    });
    if (other) {
      interactFunction(agent, other);
      agent.state.collided = true;
      other.state.collided = true;
      agent.state.lastCollision = other;
      other.state.lastCollision = agent;
    }
  }
}

sim.beforeTick = () => {
  // Update speed and heading for particles affected by wind
  sim.actors.forEach(agent => {
    if (agent.state.headingString === "wind direction") agent.state.heading = windDirection;
    if (agent.state.speedString === "wind speed") agent.state.speed = windSpeed;
  });

  // Update the velocity for each agent based on whether it's moving or not
  sim.actors.forEach(agent => {
    if (agent.state.moving) {
      agent.vel = AA.Vector.fromPolar(agent.state.speed, agent.state.heading);
    } else {
      agent.vel = AA.Vector.fromPolar(0, agent.state.heading);
    }
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

  // Reset particle state in preparation for next tick
  sim.actors.forEach(agent => {
    // Each agent can only collide once per tick
    agent.state.collided = false;
    // Agents only move if told to do so
    agent.state.moving = false;
  });
}

sim.afterTick = () => {
  // Particles bounce off each other
  sim.actors.forEach(agent => {
    if (agent.state.collided) return;

    const agentMoving = agent.state.speed > 0;
    const others = agent.overlapping("actor");
    if (others) {
      const other = others.find(a => {
        return !a.state.collided && a.state.lastCollision !== agent && agent.state.lastCollision !== a &&
          (agentMoving || a.state.speed > 0);
      });
      if (other) {
        collide(agent, other);
        agent.state.collided = true;
        other.state.collided = true;
        agent.state.lastCollision = other;
        other.state.lastCollision = agent;
      }
    }
  });
};

// set up squares (patches)
for (let x = 0; x < sim.width / sim.gridStep; x++) {
  for (let y = 0; y < sim.height / sim.gridStep; y++) {
    const square = sim.squareAt(x, y);
    square.zIndex = -Infinity;

    square.vis({ tint: "0x99cc77" });
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
function set_actual_speed(agent, speed) {
  agent.state.speed = speed;
}
function set_speed(agent, speedString) {
  agent.state.speed_string = speedString;
  set_actual_speed(agent, getSpeedNumber(speedString));
}

function getHeadingNumber(headingString) {
  if (headingString === "random") {
    return Math.random() * 2 * Math.PI;
  } else if (headingString === "up") {
    return 3 * Math.PI / 2;
  } else if (headingString === "down") {
    return Math.PI / 2;
  } else if (headingString === "left") {
    return Math.PI;
  } else if (headingString === "right") {
    return 0;
  } else if (headingString === "wind direction") {
    return windDirection;
  }
}
function set_actual_heading(agent, heading) {
  agent.state.heading = heading;
}
function set_heading(agent, headingString) {
  agent.state.heading_string = headingString;
  set_actual_heading(agent, getHeadingNumber(headingString));
}

function set_mass(agent, massString) {
  if (massString === "light") {
    agent.state.mass = 0.5;
  } else if (massString === "medium") {
    agent.state.mass = 1;
  } else if (massString === "heavy") {
    agent.state.mass = 2;
  }
}

function set_position(agent, positionString) {
  if (positionString === "random") {
    agent.x = Math.random() * sim.width;
    agent.y = Math.random() * sim.height;
  } else if (positionString === "center") {
    agent.x = sim.width / 2;
    agent.y = sim.height / 2;
  }
  // TODO: handle horizontal and vertical lines
}

function set_color(agent, colorString) {
  agent.state.colorString = colorString;
}

// air
const create_a_air = getAddActorFunction({
  label: "air",
  radius: 2
});
// Because we can't specify values for nested blocks in our current system, we ignore contained blocks and hardcode
// the MoDa specified values here.
function airCallback(agent) {
  set_speed(agent, "wind speed");
  set_position(agent, "random");
  set_heading(agent, "random");
  set_mass(agent, "medium");
  set_color(agent, "cyan");
}
function create_air(num, _callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_air();
    airCallback(agent);
    // if (_callback) _callback(agent);
  }
}

// smoke
const create_a_smoke = getAddActorFunction({
  label: "smoke",
  radius: 4
});
// Because we can't specify values for nested blocks in our current system, we ignore contained blocks and hardcode
// the MoDa specified values here.
function smokeCallback(agent) {
  set_speed(agent, "very low");
  set_position(agent, "center");
  set_heading(agent, "random");
  set_mass(agent, "medium");
  set_color(agent, "gray");
}
function create_smoke(num, _callback) {
  for (let i = 0; i < num; i++) {
    const agent = create_a_smoke();
    smokeCallback(agent);
    // if (_callback) _callback(agent);
  }
}

setup();
/*** End sim code */

/*** Blow */
// Note this does not match the MoDa sim blow block, which is just a collection of blocks.
set_heading(agent, "wind direction");
set_speed(agent, "wind speed");
agent.state.moving = true;
/*** End blow */

/*** Move */
agent.state.moving = true;
/*** End move */

/*** Erase */
agent.remove();
/*** End erase */

/*** Attach */
interact(agent, attach);
/*** End attach */

/*** Bounce off */
interact(agent, collide);
/*** End bounce off */

/*** Interact */
// Not implemented. This block is just a combination of if, touching, and bounce off blocks. But we can't set it
// up properly in our current nested block system.
/*** End interact */

/*** Touching */
isTouching(agent, "${CONDITION}");
/*** End touching */
