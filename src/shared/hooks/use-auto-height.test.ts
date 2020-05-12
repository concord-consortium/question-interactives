import React, { useRef } from "react";
import { renderHook } from "@testing-library/react-hooks";
import { useAutoHeight } from "./use-auto-height";

describe("useAutoHeight", () => {
  it("should listen to window resize event", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const HookWrapper = () => {
      const container = useRef<HTMLDivElement>(null);
      useAutoHeight({ container, setHeight: jest.fn() });
    }
    const { unmount } = renderHook(HookWrapper);
    expect(addSpy).toHaveBeenCalledWith("resize", expect.anything());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.anything());
  });
});
