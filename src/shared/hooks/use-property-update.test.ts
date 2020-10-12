import { renderHook } from "@testing-library/react-hooks";
import { usePropertyUpdate } from "./use-property-update";

describe("usePropertyUpdate", () => {
  it("detects changes correctly", () => {
    const propName = "testProp";
    const HookWrapper = (props: { state: any }) => {
      return usePropertyUpdate(props.state, propName);
    };
    const { result, rerender } = renderHook(HookWrapper, { initialProps: { state: undefined }});
    expect(result.current).toEqual(false); // state loading, no changes
    rerender({ state: undefined });
    expect(result.current).toEqual(false); // still loading, no changes
    rerender({ state: { testProp: 123 } });
    expect(result.current).toEqual(false); // state loaded, testProp has some initial value, but no changes
    rerender({ state: { testProp: "ABC" } });
    expect(result.current).toEqual(true); // 123 -> ABC, change detected
  });
});
