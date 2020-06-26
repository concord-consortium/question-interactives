import { renderHook } from "@testing-library/react-hooks";
import { useBasicLogging } from "./use-basic-logging";
import { log } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  log: jest.fn(),
  useInteractiveState: () => ({
    interactiveState: {
      answerText: "test answer text"
    }
  })
}));

const logMock = log as jest.Mock;

const input = document.createElement("input");
input.type = "text";
input.id = "input-id";
input.name = "input-name";
input.value = "input value";
document.body.append(input);

const triggerFocusIn = () => {
  // focus() doesn't work in JSDOM.
  const event = new FocusEvent("focusin", { bubbles: true });
  input.dispatchEvent(event);
};

const triggerFocusOut = () => {
  // blur() doesn't work in JSDOM.
  const event = new FocusEvent("focusout", { bubbles: true });
  input.dispatchEvent(event);
};

describe("useBasicLogging", () => {
  beforeEach(() => {
    logMock.mockClear();
  });

  it("should log focusin and focusout, and cleanup event listeners on unmount", () => {
    const HookWrapper = () => {
      return useBasicLogging();
    }
    const { unmount } = renderHook(HookWrapper);

    triggerFocusIn();
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith("focus in", {
      target_element: "input",
      target_type: "text",
      target_id: "input-id",
      target_name: "input-name",
      target_value: "input value"
    });

    triggerFocusOut();
    expect(logMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenCalledWith("focus out", {
      target_element: "input",
      target_type: "text",
      target_id: "input-id",
      target_name: "input-name",
      target_value: "input value",
      answer_text: "test answer text"
    });

    unmount();
    triggerFocusIn();
    triggerFocusOut();
    expect(logMock).toHaveBeenCalledTimes(2);
  });


  it("shouldn't do anything when it's disabled", () => {
    const HookWrapper = () => {
      return useBasicLogging({ disabled: true });
    }
    renderHook(HookWrapper);
    triggerFocusIn();
    expect(logMock).toHaveBeenCalledTimes(0);
    triggerFocusOut();
    expect(logMock).toHaveBeenCalledTimes(0);
  });
});
