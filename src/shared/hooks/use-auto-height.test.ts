import { useRef } from "react";
import { renderHook } from "@testing-library/react-hooks";
import { useAutoHeight } from "./use-auto-height";

describe("useAutoHeight", () => {
  it("should use native ResizeObserver when possible and cleanup the observer on unmount", () => {
    const observeSpy = jest.fn();
    const disconnectSpy = jest.fn();
    (window as any).ResizeObserver = function ResizeObserverMock() {
      this.observe = observeSpy;
      this.disconnect = disconnectSpy;
    };
    const HookWrapper = () => {
      const container = useRef<HTMLDivElement>(document.createElement("div"));
      useAutoHeight({ container });
    };
    const { unmount } = renderHook(HookWrapper);
    expect(observeSpy).toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("shouldn't do anything when it's disabled", () => {
    const observeSpy = jest.fn();
    const disconnectSpy = jest.fn();
    (window as any).ResizeObserver = function ResizeObserverMock() {
      this.observe = observeSpy;
      this.disconnect = disconnectSpy;
    };
    const HookWrapper = () => {
      const container = useRef<HTMLDivElement>(document.createElement("div"));
      useAutoHeight({ container, disabled: true });
    };
    const { unmount } = renderHook(HookWrapper);
    expect(observeSpy).not.toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).not.toHaveBeenCalled();
  });
});
