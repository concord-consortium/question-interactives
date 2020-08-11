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
    const container = document.createElement("div");
    const HookWrapper = () => {
      useAutoHeight({ container });
    };
    container.style.overflow = "auto";
    const { unmount } = renderHook(HookWrapper);
    expect(container.style.overflow).toEqual("hidden"); // necessary for scrollHeight to work correctly
    expect(observeSpy).toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).toHaveBeenCalled();
    expect(container.style.overflow).toEqual("auto"); // make sure that overflow is restored
  });

  it("shouldn't do anything when it's disabled", () => {
    const observeSpy = jest.fn();
    const disconnectSpy = jest.fn();
    (window as any).ResizeObserver = function ResizeObserverMock() {
      this.observe = observeSpy;
      this.disconnect = disconnectSpy;
    };
    const HookWrapper = () => {
      const container = document.createElement("div");
      useAutoHeight({ container, disabled: true });
    };
    const { unmount } = renderHook(HookWrapper);
    expect(observeSpy).not.toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).not.toHaveBeenCalled();
  });
});
