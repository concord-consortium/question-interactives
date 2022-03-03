import React from "react";
import { mount } from "enzyme";
import { DrawingTool, LARA_IMAGE_PROXY } from "./drawing-tool";

jest.mock("drawing-tool", () => class DrawingToolLib {
  on = jest.fn();
  pauseHistory = jest.fn();
  unpauseHistory = jest.fn();
  setBackgroundImage = setBackgroundImageMock;
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
});
