import { useRef } from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import { useDelayedValidation } from "./use-delayed-validation";
import Form from "react-jsonschema-form";

describe("useDelayedValidation", () => {
  it("should call clearTimeout and setTimeout when trigger is called", () => {
    const clearSpy = jest.spyOn(window, "clearTimeout");
    const setSpy = jest.spyOn(window, "setTimeout");
    const HookWrapper = () => {
      const formRef = useRef<Form<any>>(null);
      return useDelayedValidation({ formRef, delay: 123 });
    };
    const { result } = renderHook(HookWrapper);
    act(() => {
      result.current();
    });
    expect(clearSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith(expect.anything(), 123);
  });
});
