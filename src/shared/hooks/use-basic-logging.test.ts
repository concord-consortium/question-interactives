import { renderHook } from "@testing-library/react-hooks";
import { useBasicLogging, _setIntersectionDelay } from "./use-basic-logging";
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

// Mock IntersectionObserver
const intersectionObserverObserve = jest.fn();
const intersectionObserverDisconnect = jest.fn();
let intersectionObserverCallback: any = null;
(window as any).IntersectionObserver = (callback: any, options: any) => {
  intersectionObserverCallback = callback;
  return {
    observe: intersectionObserverObserve,
    disconnect: intersectionObserverDisconnect
  } as any as IntersectionObserver;
};

// Speed up tests.
const intersectionObserverDelay = 1;
_setIntersectionDelay(intersectionObserverDelay);


describe("useBasicLogging", () => {
  beforeEach(() => {
    logMock.mockClear();
    intersectionObserverObserve.mockClear();
    intersectionObserverDisconnect.mockClear();
    intersectionObserverCallback = null;
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

  it("should scroll into view and out of view, and cleanup event listeners on unmount", (done) => {
    const HookWrapper = () => {
      return useBasicLogging();
    }
    const { unmount } = renderHook(HookWrapper);

    setTimeout(() => {
      expect(intersectionObserverObserve).toHaveBeenCalledWith(window.document.body);

      intersectionObserverCallback([{isIntersecting: true}]);
      expect(logMock).toHaveBeenCalledTimes(1);
      expect(logMock).toHaveBeenCalledWith("scrolled into view");

      intersectionObserverCallback([{isIntersecting: false}]);
      expect(logMock).toHaveBeenCalledTimes(2);
      expect(logMock).toHaveBeenCalledWith("scrolled out of view");

      unmount();

      expect(intersectionObserverDisconnect).toHaveBeenCalled();

      done();
    }, intersectionObserverDelay + 1);
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
