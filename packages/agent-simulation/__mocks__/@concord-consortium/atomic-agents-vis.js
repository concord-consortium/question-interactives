/* eslint-env node */
// __mocks__/@concord-consortium/atomic-agents-vis.js
// Minimal-ish mock that works in jsdom and covers common APIs.

const vis = jest.fn((sim, options = {}) => {
  const root = document.createElement("div");
  const canvas = document.createElement("canvas");
  root.appendChild(canvas);

  // Tiny fake PIXI app shape
  const app = {
    stage: { addChild: jest.fn(), removeChild: jest.fn(), children: [] },
    renderer: { resize: jest.fn() }
  };

  return {
    root,
    canvas,
    app,
    destroy: jest.fn(() => root.remove()),
    resize: jest.fn(),
    setSimSpeed: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  };
});

const visObs = jest.fn((sim, options = {}) => {
  const node = document.createElement("div");
  node.dataset.visObs = "1";
  return node;
});

// Handy palette (adjust as you like)
const colors = Object.assign([0xff9900, 0x3366cc, 0xdd5544], {
  orange: 0xff9900,
  blue: 0x3366cc,
  red: 0xdd5544
});

// Very loose PIXI stub; extend if your code touches more
const PIXI = {
  Graphics: function () {
    // Mock Graphics constructor
  },
  Application: function () {
    // Mock Application constructor
  }
};

// Small helpers used in some examples
const line = jest.fn(() => ({ type: "line" }));
const text = jest.fn(() => ({ type: "text" }));

// Support both named and default imports
module.exports = {
  __esModule: true,
  default: { vis, visObs, colors, PIXI, line, text },
  vis,
  visObs,
  colors,
  PIXI,
  line,
  text
};
