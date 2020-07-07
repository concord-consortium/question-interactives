import React, { useRef } from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState } from "./app";
import css from "./runtime.scss";

const authoredState: IAuthoredState = {
  version: 1,
  url: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  allowLightbox: true,
  scaling: "fitWidth"
};
const naturalWidthImageAuthoredState: IAuthoredState = {
  version: 1,
  url: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  allowLightbox: true,
  scaling: "originalDimensions"
};

describe("Runtime", () => {
  it("renders image and all other supplied fields", () => {
    const container = useRef<HTMLDivElement>(document.createElement("div"));
    const wrapper = shallow(<Runtime authoredState={authoredState} baseContainer={container}/>);

    expect(wrapper.text()).toEqual(expect.stringContaining("Image showing the CC Logo"));
    expect(wrapper.text()).toEqual(expect.stringContaining("Copyright Concord Consortium"));
    expect(wrapper.text()).toEqual(expect.stringContaining("Concord.org"));
    expect(wrapper.find("img").at(0).props().src).toEqual(authoredState.url);
    expect(wrapper.find("img").at(0).props().title).toEqual(authoredState.altText);
    expect(wrapper.find("a").at(0).props().href).toEqual(authoredState.creditLink);
    expect(wrapper.find("img").at(0).hasClass(css.fitWidth));

  });
  it("renders image at native resolution when specified", () => {
    const container = useRef<HTMLDivElement>(document.createElement("div"));
    const wrapper = shallow(<Runtime authoredState={naturalWidthImageAuthoredState} baseContainer={container}/>);

    expect(wrapper.find("img").at(0).hasClass(css.originalDimensions));

  });

});
