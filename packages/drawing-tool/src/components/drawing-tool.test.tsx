import React from "react";
import { mount } from "enzyme";
import { DrawingTool, LARA_IMAGE_PROXY } from "./drawing-tool";

jest.mock("@concord-consortium/drawing-tool", () => class DrawingToolLib {
  on = jest.fn();
  resetHistory = jest.fn();
  save = jest.fn();
  setBackgroundImage = setBackgroundImageMock;
  // Mirror the real library: append a .dt-canvas-container with tabindex="0" to the
  // element matched by the selector. Only works when the component is attached to the
  // document (see the "read-only canvas" tests); the other tests mount detached, so this
  // is a no-op for them.
  constructor(selector: string) {
    // The wrapper always passes "#<id>"; look the element up by id (querySelector would
    // throw on uuid ids that start with a digit, matching how the real lib finds it).
    const el = document.getElementById(selector.replace(/^#/, ""));
    if (el) {
      const canvasContainer = document.createElement("div");
      canvasContainer.className = "dt-canvas-container";
      canvasContainer.setAttribute("tabindex", "0");
      el.appendChild(canvasContainer);
    }
  }
});

const setBackgroundImageMock = jest.fn();

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const
};

describe("DrawingTool", () => {
  beforeEach(() => {
    setBackgroundImageMock.mockClear();
  });

  describe("when backgroundSource = url", () => {
    it("sets background using backgroundImageUrl", () => {
      const authoredStateWithBg = {
        ...authoredState,
        backgroundSource: "url" as const,
        backgroundImageUrl: "http://aws.concord.org/image.png"
      };
      mount(<DrawingTool authoredState={authoredStateWithBg} />);
      expect(setBackgroundImageMock).toHaveBeenCalled();
      expect(setBackgroundImageMock.mock.calls[0][0].src).toEqual("http://aws.concord.org/image.png");
    });

    it("uses LARA image proxy when necessary", () => {
      const authoredStateWithExternalBg = {
        ...authoredState,
        backgroundSource: "url" as const,
        backgroundImageUrl: "http://aws.example.com/image.png"
      };
      mount(<DrawingTool authoredState={authoredStateWithExternalBg} />);
      expect(setBackgroundImageMock).toHaveBeenCalled();
      expect(setBackgroundImageMock.mock.calls[0][0].src).toEqual(LARA_IMAGE_PROXY + "http://aws.example.com/image.png");
    });
  });

  // The library always makes the canvas container a tab stop (tabindex="0"). A read-only
  // Drawing Tool — e.g. a Labbook thumbnail preview — is not interactive, so it should not
  // add an extra keyboard tab stop. See QI-156.
  describe("read-only canvas keyboard focus", () => {
    let container: HTMLDivElement;
    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });
    afterEach(() => {
      document.body.removeChild(container);
    });

    it("removes the canvas container from the tab order when readOnly", () => {
      const wrapper = mount(<DrawingTool authoredState={authoredState} readOnly={true} />, { attachTo: container });
      const canvasContainer = container.querySelector(".dt-canvas-container");
      expect(canvasContainer).not.toBeNull();
      expect(canvasContainer?.getAttribute("tabindex")).toEqual("-1");
      wrapper.unmount();
    });

    it("keeps the canvas container focusable when not readOnly", () => {
      const wrapper = mount(<DrawingTool authoredState={authoredState} readOnly={false} />, { attachTo: container });
      const canvasContainer = container.querySelector(".dt-canvas-container");
      expect(canvasContainer).not.toBeNull();
      expect(canvasContainer?.getAttribute("tabindex")).toEqual("0");
      wrapper.unmount();
    });
  });
});
