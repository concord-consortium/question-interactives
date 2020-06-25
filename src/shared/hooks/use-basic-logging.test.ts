import { renderHook } from "@testing-library/react-hooks";
import { useBasicLogging } from "./use-basic-logging";
import { log } from "@concord-consortium/lara-interactive-api";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  log: jest.fn()
}));

const logMock = log as jest.Mock;

const input = document.createElement("input");
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
    expect(logMock).toHaveBeenCalledWith("focus in", { focus_target: "input" });

    triggerFocusOut();
    expect(logMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenCalledWith("focus out");

    unmount();
    triggerFocusIn();
    triggerFocusOut();
    expect(logMock).toHaveBeenCalledTimes(2);
  });

  it("should log an answerText on focusout event if answer has been updated", () => {
    const HookWrapper = () => {
      return useBasicLogging();
    }
    const { unmount, result } = renderHook(HookWrapper);
    triggerFocusOut();
    // "focus out" only, no "answer saved"
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock.mock.calls[0][0]).toEqual("focus out");

    logMock.mockClear();
    result.current.onAnswerUpdate("test answer");
    triggerFocusOut();
    expect(logMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenCalledWith("answer saved", {answer_text: "test answer"});

    logMock.mockClear();
    triggerFocusOut();
    // "focus out" only, no "answer saved"
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock.mock.calls[0][0]).toEqual("focus out");

    logMock.mockClear();
    unmount();
    result.current.onAnswerUpdate("test answer");
    triggerFocusOut();
    // no logs after unmount.
    expect(logMock).toHaveBeenCalledTimes(0);
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
