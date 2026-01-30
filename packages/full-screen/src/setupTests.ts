/* eslint-disable @typescript-eslint/no-var-requires */
const enzyme = require("enzyme");
const Adapter = require("@wojtekmaj/enzyme-adapter-react-17");
import "@testing-library/jest-dom";
/* eslint-enable @typescript-eslint/no-var-requires */

enzyme.configure({ adapter: new Adapter() });

// Polyfill crypto.getRandomValues for nanoid used by lara-interactive-api
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = {
    getRandomValues: (buffer: Uint8Array) => {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    }
  };
}

// https://www.benmvp.com/blog/quick-trick-jest-asynchronous-tests/
beforeEach(() => {
  // ensure there's at least one assertion run for every test case
  expect.hasAssertions();
});
