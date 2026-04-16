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

  it("prunes columns that are no longer in the active set", () => {
    const { result } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    act(() => {
      result.current.setVisibility("a", false);
    });
    // register without "a" — "a" should be pruned
    act(() => {
      result.current.registerColumns(["b", "c"]);
    });
    expect(result.current.visibility.a).toBeUndefined();
    expect(result.current.visibility.b).toBe(true);
    expect(result.current.visibility.c).toBe(true);
  });

  it("defaults reappearing columns to visible after pruning", () => {
    const { result } = renderHook(() => useToggleState());
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    act(() => {
      result.current.setVisibility("a", false);
    });
    // prune "a"
    act(() => {
      result.current.registerColumns(["b"]);
    });
    // bring "a" back — it was pruned so it defaults to visible
    act(() => {
      result.current.registerColumns(["a", "b"]);
    });
    expect(result.current.visibility.a).toBe(true);
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
