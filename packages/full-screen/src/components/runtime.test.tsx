import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState } from "./types";

// Mock screenfull - simulate screenfull being available and enabled
// NOTE: jest.mock is hoisted, so the factory can't reference variables declared
// in the test file. We define the mock object inline.
jest.mock("screenfull", () => ({
  isEnabled: true,
  isFullscreen: false,
  toggle: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockScreenfull = require("screenfull");

// Mock lara-interactive-api
let initMessage: any = {};
const mockSetSupportedFeatures = jest.fn();
const mockSetHint = jest.fn();
jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(() => initMessage),
  useAccessibility: jest.fn(() => ({})),
  setSupportedFeatures: (...args: any[]) => mockSetSupportedFeatures(...args),
  setHint: (...args: any[]) => mockSetHint(...args)
}));

// Mock helpers hooks/components
jest.mock("@concord-consortium/question-interactives-helpers/src/hooks/use-force-update", () => ({
  useForceUpdate: () => jest.fn()
}));

let lastIframeRuntimeProps: any = null;
jest.mock("@concord-consortium/question-interactives-helpers/src/components/iframe-runtime", () => ({
  IframeRuntime: (props: any) => {
    lastIframeRuntimeProps = props;
    return null;
  }
}));

// Mock query-string for location.search parsing
jest.mock("query-string", () => ({
  parse: jest.fn(() => ({ wrappedInteractive: null }))
}));

describe("Runtime", () => {
  const defaultAuthoredState: IAuthoredState = {
    version: 1,
    questionType: "iframe_interactive",
    wrappedInteractiveUrl: "https://codap.concord.org/app?interactiveApi&documentId=doc123"
  };

  const defaultInteractiveState: any = {
    subinteractiveStates: {},
    currentSubinteractiveId: "",
    submitted: false,
    answerType: "interactive_state"
  };

  beforeEach(() => {
    initMessage = {};
    mockScreenfull.isFullscreen = false;
    lastIframeRuntimeProps = null;
    jest.clearAllMocks();
  });

  it("renders IframeRuntime with wrappedInteractiveUrl from authored state", () => {
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps).not.toBeNull();
    expect(lastIframeRuntimeProps.url).toBe(defaultAuthoredState.wrappedInteractiveUrl);
  });

  it("shows message when no URL is configured", () => {
    const authoredState: IAuthoredState = {
      version: 1,
      questionType: "iframe_interactive"
    };
    const wrapper = mount(
      <Runtime
        authoredState={authoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(wrapper.text()).toContain("Wrapped interactive is not configured");
  });

  it("renders FullScreenButton when screenfull is available and fullscreen not disabled", () => {
    const wrapper = mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(wrapper.find("FullScreenButton").length).toBe(1);
  });

  it("does not render FullScreenButton when disableFullscreen is true", () => {
    const authoredState: IAuthoredState = {
      ...defaultAuthoredState,
      disableFullscreen: true
    };
    const wrapper = mount(
      <Runtime
        authoredState={authoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(wrapper.find("FullScreenButton").length).toBe(0);
  });

  it("calls setSupportedFeatures with interactiveState and aspectRatio", () => {
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(mockSetSupportedFeatures).toHaveBeenCalledWith(
      expect.objectContaining({
        interactiveState: true,
        aspectRatio: expect.any(Number)
      })
    );
  });

  it("passes report=true when initMessage mode is 'report'", () => {
    initMessage = { mode: "report" };
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps.report).toBe(true);
  });

  it("passes report=false when initMessage mode is not 'report'", () => {
    initMessage = { mode: "authoring" };
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps.report).toBe(false);
  });

  it("passes flushOnSave=true to IframeRuntime", () => {
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps.flushOnSave).toBe(true);
  });

  it("passes setHint to IframeRuntime", () => {
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps.setHint).toBeDefined();
  });

  it("registers screenfull change listener on mount", () => {
    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(mockScreenfull.on).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("still renders FullScreenButton when disableFullscreen is undefined", () => {
    const authoredState: IAuthoredState = {
      ...defaultAuthoredState,
      disableFullscreen: undefined
    };
    const wrapper = mount(
      <Runtime
        authoredState={authoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(wrapper.find("FullScreenButton").length).toBe(1);
  });

  it("uses query param URL when authoredState has no wrappedInteractiveUrl", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const queryString = require("query-string");
    (queryString.parse as jest.Mock).mockReturnValueOnce({
      wrappedInteractive: "https://fallback.example.com/app"
    });

    const authoredState: IAuthoredState = {
      version: 1,
      questionType: "iframe_interactive"
      // no wrappedInteractiveUrl
    };
    mount(
      <Runtime
        authoredState={authoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps).not.toBeNull();
    expect(lastIframeRuntimeProps.url).toBe("https://fallback.example.com/app");
  });

  it("prefers authoredState URL over query param URL", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const queryString = require("query-string");
    (queryString.parse as jest.Mock).mockReturnValueOnce({
      wrappedInteractive: "https://fallback.example.com/app"
    });

    mount(
      <Runtime
        authoredState={defaultAuthoredState}
        interactiveState={defaultInteractiveState}
        setInteractiveState={jest.fn()}
      />
    );
    expect(lastIframeRuntimeProps.url).toBe(defaultAuthoredState.wrappedInteractiveUrl);
  });
});
