import { renderHook } from "@testing-library/react-hooks";
import { useContextInitMessage } from "./use-context-init-message";

describe("useContextInitMessage", () => {
  it("should return an error if it is called from outside a context", () => {
    const HookWrapper = () => {
      useContextInitMessage();
    };
    const { result } = renderHook(HookWrapper);
    expect(result.error?.message).toBe("useContextInitMessage must be used within a <InitMessageContext.Provider>");
  });
});
