import { renderHook } from "@testing-library/react-hooks";
import {
  addFocusEnterListener,
  removeFocusEnterListener,
  sendFocusExit,
} from "@concord-consortium/lara-interactive-api";
import { useFocusProtocol } from "./use-focus-protocol";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  addFocusEnterListener: jest.fn(),
  removeFocusEnterListener: jest.fn(),
  sendFocusExit: jest.fn(),
}));

const addFocusEnterListenerMock = addFocusEnterListener as jest.Mock;
const removeFocusEnterListenerMock = removeFocusEnterListener as jest.Mock;
const sendFocusExitMock = sendFocusExit as jest.Mock;

type FocusEnterMode = "forward" | "reverse" | "restore";
let capturedListener: ((mode: FocusEnterMode) => void) | undefined;

const dispatchFocusIn = (el: HTMLElement) => {
  el.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
};

const dispatchEscape = () => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
};

const setBody = () => {
  document.body.innerHTML = `
    <button id="first">first</button>
    <input id="middle" />
    <button id="last">last</button>
  `;
};

const byId = (id: string) => document.getElementById(id) as HTMLElement;

describe("useFocusProtocol", () => {
  beforeEach(() => {
    setBody();
    capturedListener = undefined;
    addFocusEnterListenerMock.mockReset();
    removeFocusEnterListenerMock.mockReset();
    sendFocusExitMock.mockReset();
    addFocusEnterListenerMock.mockImplementation((cb: (mode: FocusEnterMode) => void) => {
      capturedListener = cb;
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("focuses the first focusable on focusEnter('forward')", () => {
    renderHook(() => useFocusProtocol({ enabled: true }));
    capturedListener?.("forward");
    expect(document.activeElement).toBe(byId("first"));
  });

  it("focuses the last focusable on focusEnter('reverse')", () => {
    renderHook(() => useFocusProtocol({ enabled: true }));
    capturedListener?.("reverse");
    expect(document.activeElement).toBe(byId("last"));
  });

  it("focuses the last-focused element on focusEnter('restore')", () => {
    renderHook(() => useFocusProtocol({ enabled: true }));
    dispatchFocusIn(byId("middle"));
    capturedListener?.("restore");
    expect(document.activeElement).toBe(byId("middle"));
  });

  it("falls back to the first focusable on restore when nothing was focused", () => {
    renderHook(() => useFocusProtocol({ enabled: true }));
    capturedListener?.("restore");
    expect(document.activeElement).toBe(byId("first"));
  });

  it("sends focusExit('escape') on Escape", () => {
    renderHook(() => useFocusProtocol({ enabled: true }));
    dispatchEscape();
    expect(sendFocusExitMock).toHaveBeenCalledWith("escape");
  });

  it("does not record document.body as the last-focused element", () => {
    renderHook(() => useFocusProtocol({ enabled: true }));
    dispatchFocusIn(byId("middle"));
    dispatchFocusIn(document.body);
    capturedListener?.("restore");
    expect(document.activeElement).toBe(byId("middle"));
  });

  it("cleans up listeners on unmount", () => {
    const { unmount } = renderHook(() => useFocusProtocol({ enabled: true }));
    unmount();
    expect(removeFocusEnterListenerMock).toHaveBeenCalled();
    dispatchEscape();
    expect(sendFocusExitMock).not.toHaveBeenCalled();
  });

  it("is a no-op when disabled", () => {
    renderHook(() => useFocusProtocol({ enabled: false }));
    expect(addFocusEnterListenerMock).not.toHaveBeenCalled();
    dispatchEscape();
    expect(sendFocusExitMock).not.toHaveBeenCalled();
  });
});
