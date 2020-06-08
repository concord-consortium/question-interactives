import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";

const authoredState = {
  version: 1,
  url: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  allowLightbox: true,
  fullWidth: true
};

const interactiveState = {
  viewed: true,
  submitted: undefined
};

describe("Runtime", () => {
  it("renders caption and image", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.caption));
  });
});
describe("Authoring", () => {
  it("renders caption and image", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.caption));
  });
});
describe("report mode", () => {
  it("renders caption and image", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} report={true} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.caption));
  });
});
