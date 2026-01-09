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

// Mock window.alert
global.alert = jest.fn();

// https://www.benmvp.com/blog/quick-trick-jest-asynchronous-tests/
beforeEach(() => {
  // ensure there's at least one assertion run for every test case
  expect.hasAssertions();
});

// Mock HTMLCanvasElement.getContext to prevent jsdom errors in Jest tests.
// Blockly and other libraries use <canvas> for text measurement and rendering,
// but jsdom does not implement the canvas API. This mock suppresses
// "Not implemented: HTMLCanvasElement.prototype.getContext" errors in test output.
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: () => ({
    measureText: () => ({ width: 0 }),
  }),
});
