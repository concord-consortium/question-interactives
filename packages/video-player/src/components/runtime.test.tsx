import React from "react";
import { render } from "@testing-library/react";
import { Runtime, getAspectRatio } from "./runtime";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt",
  videoUrl: "https://models-resources.concord.org/geniblocks/resources/fablevision/video/charcoal.mp4",
  caption: "This is a test caption for the video.",
  captionUrl: "https://models-resources.concord.org/question-interactives/test-captions.vtt",
  poster: "https://models-resources.concord.org/geniblocks/resources/fablevision/rooms/missioncontrol.jpg",
  credit: "Concord.org",
  creditLink: "https://geniventure.concord.org",
  creditLinkDisplayText: "Geniventure",
  required: true,
  fixedAspectRatio: "2:1",
  fixedHeight: 300,
  fixedWidth: 600
};

const interactiveState = {
  answerType: "interactive_state" as const,
  percentageViewed: 0.2,
  lastViewedTimestamp: 1.2
};

beforeEach(() => {
  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.pause = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn();
});

describe("Runtime", () => {
  it("renders prompt and video with credits", () => {
    const { container, getByText } = render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(getByText(authoredState.prompt)).toBeDefined();
    expect(container.querySelectorAll("video").length).toBe(1);
    expect(container.querySelectorAll("video")[0].poster).toBe(authoredState.poster);
    expect(getByText(authoredState.caption)).toBeDefined();
    expect(getByText(authoredState.credit)).toBeDefined();
    expect(getByText(authoredState.creditLinkDisplayText)).toBeDefined();
  });

  it("renders video in a paused state at the point where it was previously played until", () => {
    const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} interactiveState={interactiveState} /></DynamicTextTester>);
    expect(container.querySelectorAll("video").length).toBe(1);
    expect(container.querySelectorAll(".vjs-paused").length).toBe(1);
  });

  it("parses aspect ratio", () => {
    expect(getAspectRatio("2:1")).toEqual("2:1");
    expect(getAspectRatio("1.5")).toEqual("150:100");
    expect(getAspectRatio("")).toEqual("");
    expect(getAspectRatio("abc")).toEqual("");
  });
});

describe("Report", () => {
  it("renders video in read-only mode", () => {
    const { container } = render(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(container.querySelectorAll("video").length).toBe(1);
    expect(container.querySelectorAll("video")[0].ontimeupdate).toBe(null);
    expect(container.querySelectorAll("video")[0].onpause).toBe(null);
    expect(container.querySelectorAll("video")[0].controls).toBe(false);
  });
});
