import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";

const authoredState = {
  version: 1,
  prompt: "Test prompt",
  videoUrl: "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/video/charcoal.mp4",
  disableNextButton: true
};

describe("Runtime", () => {
  it("renders prompt and video", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.find("video").length).toEqual(1);
  });
});
