/* eslint-disable @typescript-eslint/no-var-requires */
const enzyme = require("enzyme");
const Adapter = require("@wojtekmaj/enzyme-adapter-react-17");
import "@testing-library/jest-dom";
/* eslint-enable @typescript-eslint/no-var-requires */

enzyme.configure({ adapter: new Adapter() });

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
