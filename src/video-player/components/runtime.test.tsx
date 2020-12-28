import React from "react";
import { shallow } from "enzyme";
import { Runtime, getAspectRatio } from "./runtime";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt",
  videoUrl: "https://models-resources.concord.org/geniblocks/resources/fablevision/video/charcoal.mp4",
  captionUrl: "https://models-resources.concord.org/question-interactives/test-captions.vtt",
  poster: "https://models-resources.concord.org/geniblocks/resources/fablevision/rooms/missioncontrol.jpg",
  credit: "Concord.org",
  creditLink: "https://geniventure.concord.org",
  creditLinkDisplayText: "Geniventure",
  required: true
};

const interactiveState = {
  answerType: "interactive_state" as const,
  percentageViewed: 0.2,
  lastViewedTimestamp: 1.2
};

describe("Runtime", () => {
  it("renders prompt and video with credits", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    // not sure, for now, how to pull the content from the DecorateChildren component
    expect(wrapper.text()).toEqual(expect.stringContaining("<DecorateChildren />"));
    expect(wrapper.find("video").length).toEqual(1);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.credit));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.creditLinkDisplayText));
    expect(wrapper.find(".video-js").prop("poster")).toEqual(authoredState.poster);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(interactiveState.lastViewedTimestamp.toString()));
  });

  it("parses aspect ratio", () => {
    expect(getAspectRatio("2:1")).toEqual("2:1");
    expect(getAspectRatio("1.5")).toEqual("150:100");
    expect(getAspectRatio("")).toEqual("");
    expect(getAspectRatio("abc")).toEqual("");
  });
});
