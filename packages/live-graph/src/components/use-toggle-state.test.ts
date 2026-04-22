import { renderHook, act } from "@testing-library/react-hooks";
import { useToggleState } from "./use-toggle-state";

describe("useToggleState", () => {
  it("defaults new columns to visible on registerColumns", () => {
    const { result } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    expect(result.current.visibility).toEqual({ a: true, b: true });
  });

  it("preserves toggle across registerColumns for the same name", () => {
    const { result } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    act(() => {
      result.current.setVisibility("a", false);
    });
    act(() => {
      result.current.registerColumns(["a", "b", "c"]);
    });
    expect(result.current.visibility.a).toBe(false);
    expect(result.current.visibility.c).toBe(true);
  });

  it("retains toggle state for columns not in the current active set", () => {
    const { result } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    act(() => {
      result.current.setVisibility("a", false);
    });
    // register without "a" — "a" should keep its persisted state
    act(() => {
      result.current.registerColumns(["b", "c"]);
    });
    expect(result.current.visibility.a).toBe(false);
    expect(result.current.visibility.b).toBe(true);
    expect(result.current.visibility.c).toBe(true);
  });

  it("preserves toggle state for columns that disappear and reappear", () => {
    const { result } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    act(() => {
      result.current.setVisibility("a", false);
    });
    // "a" disappears for one recording
    act(() => {
      result.current.registerColumns(["b"]);
    });
    // "a" reappears — its toggled-off state should persist
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    expect(result.current.visibility.a).toBe(false);
  });

  it("returns a stable visibility reference when nothing changes", () => {
    const { result, rerender } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a"]);
    });
    const first = result.current.visibility;
    rerender();
    expect(result.current.visibility).toBe(first);
  });
});
