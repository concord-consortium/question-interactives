/* eslint-disable @typescript-eslint/no-var-requires */
const enzyme = require("enzyme");
const Adapter = require("@wojtekmaj/enzyme-adapter-react-17");
import "@testing-library/jest-dom";
/* eslint-enable @typescript-eslint/no-var-requires */

enzyme.configure({ adapter: new Adapter() });

// Polyfill for crypto.getRandomValues (required by nanoid in lara-interactive-api v1.12.0-pre.1)
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = {
    getRandomValues: (buffer: Uint8Array) => {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    },
  };
}

// Mock HTMLCanvasElement for Chart.js in Jest tests.
// Chart.js requires canvas context for rendering, but jsdom does not implement the canvas API.
// This mock provides the minimum methods and properties needed by Chart.js to prevent test errors.
(HTMLCanvasElement.prototype as any).getContext = function() {
  return {
    canvas: this,
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    strokeRect: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  };
};

// Mock canvas dimensions
Object.defineProperty(HTMLCanvasElement.prototype, "width", {
  get() { return this._width || 300; },
  set(value) { this._width = value; },
});

Object.defineProperty(HTMLCanvasElement.prototype, "height", {
  get() { return this._height || 150; },
  set(value) { this._height = value; },
});

// https://www.benmvp.com/blog/quick-trick-jest-asynchronous-tests/
beforeEach(() => {
  // ensure there's at least one assertion run for every test case
  expect.hasAssertions();
});
