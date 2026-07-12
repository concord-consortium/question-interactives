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

// Blockly 13 fetches its workspace sounds during inject(). jsdom provides no global
// fetch, and the resulting unhandled rejection kills the Jest worker rather than
// failing a test, so every suite that injects a workspace must have one available.
// jsdom has no AudioContext either, so Blockly skips decoding whatever this returns.
// Stub unconditionally: were the environment ever to supply a real fetch, tests would
// silently start requesting the sound files over the network.
(globalThis as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
);

// Blockly 13's stylesheet uses `:has()` nested inside `:not()` for its keyboard-focus
// rules. jsdom's selector engine (nwsapi) cannot parse that and throws "is not a valid
// selector" out of inject(), so no workspace renders under test. jsdom only fixed this
// in v27 by replacing nwsapi, and no jest-environment-jsdom runs a jsdom that new.
// Dropping the offending rules keeps the rest of the stylesheet intact; they only drive
// focus-ring styling, which jsdom does not render and no test asserts on.
//
// This is a workaround for a jsdom limitation, not a Blockly one, so it is gated on the
// limitation itself rather than on a version number: the day jsdom can parse the selector,
// the check below fails and tells us to delete all of this.
const BLOCKLY_FOCUS_SELECTOR =
  ".blocklyKeyboardNavigation:not(:has(.blocklyDropDownDiv:focus-within, .blocklyWidgetDiv:focus-within)) " +
  ".blocklyPassiveFocus:is(.blocklyPath, .blocklyHighlightedConnectionPath)";

const selectorEngineRejectsHas = (() => {
  try {
    document.createElement("div").matches(BLOCKLY_FOCUS_SELECTOR);
    return false;
  } catch {
    return true;
  }
})();

if (!selectorEngineRejectsHas) {
  throw new Error(
    "jsdom can now parse Blockly's `:has()` focus selectors, so the stylesheet workaround " +
    "in setupTests.ts is obsolete. Delete removeHasRules and the HTMLStyleElement " +
    "textContent patch below (and this check), then re-run the tests."
  );
}

const removeHasRules = (css: string): string => {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) {
      out += css.slice(i);
      break;
    }
    const prelude = css.slice(i, open);
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const body = css.slice(open + 1, j - 1);
    if (prelude.trimStart().startsWith("@")) {
      // At-rules (@media, @supports) nest further rules, so recurse into the block.
      out += `${prelude}{${removeHasRules(body)}}`;
    } else if (!prelude.includes(":has(")) {
      out += css.slice(i, j);
    }
    i = j;
  }
  return out;
};

const textContent = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
if (!textContent?.get || !textContent?.set) {
  // We know from the probe above that the workaround is still needed. Skipping it silently
  // would surface later as an opaque selector-parse failure out of inject(), so say so here.
  throw new Error(
    "Cannot patch HTMLStyleElement.textContent: Node.prototype.textContent is not an " +
    "accessor in this environment, so Blockly's `:has()` rules cannot be stripped. " +
    "The suite will fail on selector parsing until this shim is reworked."
  );
}

Object.defineProperty(HTMLStyleElement.prototype, "textContent", {
  configurable: true,
  get(this: HTMLStyleElement) {
    return textContent.get?.call(this);
  },
  set(this: HTMLStyleElement, value: string) {
    const css = String(value ?? "");
    // Only touch Blockly's own stylesheet. Rewriting every <style> in the suite could
    // strip `:has()` from unrelated code and hide a genuine selector problem there.
    const isBlocklyStylesheet = this.id === "blockly-common-style" || css.includes(".blockly");
    textContent.set?.call(this, isBlocklyStylesheet ? removeHasRules(css) : css);
  },
});

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
