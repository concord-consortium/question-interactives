import { renderHook, act } from "@testing-library/react-hooks";
import { useLARAInteractiveAPI } from "./use-lara-interactive-api";

const HookWrapper = () => useLARAInteractiveAPI({ authoredState: true, interactiveState: true });

describe("useLARAInteractiveAPI", () => {
  it("returns undefined as initial values of properties that require iframe-phone connection", () => {
    const { result } = renderHook(HookWrapper);
    expect(result.current.mode).toEqual(undefined);
    expect(result.current.authoredState).toEqual(undefined);
    expect(result.current.interactiveState).toEqual(undefined);
  });
});
