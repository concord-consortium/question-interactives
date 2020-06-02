import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";

const authoredState = {
  version: 1,
  prompt: "Test prompt",
  videoUrl: "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/video/charcoal.mp4",
  captionUrl: "https://models-resources.s3.amazonaws.com/question-interactives/test-captions.vtt",
  poster: "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/rooms/missioncontrol.jpg",
  credit: "Concord.org",
  creditLink: "https://geniventure.concord.org",
  creditLinkDisplayText: "Geniventure",
  required: true
};

const interactiveState = {
  percentageViewed: 0.2,
  lastViewedTimestamp: 1.2
}

describe("Runtime", () => {
  it("renders prompt and video with credits", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.find("video").length).toEqual(1);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.credit));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.creditLinkDisplayText));
    expect(wrapper.find(".video-js").prop("poster")).toEqual(authoredState.poster);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(interactiveState.lastViewedTimestamp.toString()));

  });
});