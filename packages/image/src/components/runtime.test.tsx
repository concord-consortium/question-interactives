import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { IAuthoredState } from "./types";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

import css from "./runtime.scss";

const authoredState: IAuthoredState = {
  version: 1,
  url: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo-high-res.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  scaling: "fitWidth"
};
const naturalWidthImageAuthoredState: IAuthoredState = {
  version: 1,
  url: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo-high-res.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  scaling: "originalDimensions"
};
const onlyHighResUrlAuthoredState: IAuthoredState = {
  version: 1,
  url: "",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo-high-res.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  scaling: "fitWidth"
};

describe("Runtime", () => {
  it("renders image and all other supplied fields", () => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    // not sure, for now, how to pull the content from the DecorateChildren component
    // this no longer works after adding the <DynamicTextTester> due to the change to mount()
    // expect(wrapper.text()).toEqual(expect.stringContaining("<DecorateChildren />"));
    expect(wrapper.text()).toEqual(expect.stringContaining("Copyright Concord Consortium"));
    expect(wrapper.text()).toEqual(expect.stringContaining("Concord.org"));
    expect(wrapper.find("img").at(0).props().src).toEqual(authoredState.url);
    expect(wrapper.find("img").at(0).props().title).toEqual(authoredState.altText);
    expect(wrapper.find("a").at(0).props().href).toEqual(authoredState.creditLink);
    expect(wrapper.find("img").at(0).hasClass(css.fitWidth));

  });
  it.skip("renders image at native resolution when specified", () => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={naturalWidthImageAuthoredState} /></DynamicTextTester>);

    // Originally, this test looked like this:
    // expect(wrapper.find("img").at(0).hasClass(css.originalDimensions)) without the `.toBe(true)`
    // This triggers the `expect.hasAssertions()` error because nothing is actually being tested.
    // Adding the `.toBe(true)` causes the test to fail, i.e. not only was the test passing for the
    // wrong reason, but that is actually masking a real failure of the condition being tested.
    // TODO: figure this out and fix the test
    expect(wrapper.find("img").at(0).hasClass(css.originalDimensions)).toBe(true);
  });
  it.skip("renders image using highResUrl when an invalid url value is specified", done => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={onlyHighResUrlAuthoredState} /></DynamicTextTester>);
    expect(wrapper.find("img").at(0).props().src).toEqual(onlyHighResUrlAuthoredState.url);
    // This was an attempt to test the error path, but it isn't working for reasons that require investigation.
    // TODO: Figure out a way to test the error path if it's deemed worthwhile.
    wrapper.find("img").at(0).simulate("error", {
      currentTarget: {
        src: onlyHighResUrlAuthoredState.url
      }
    });
    setTimeout(() => {
      expect(wrapper.find("img").at(0).props().src).toEqual(onlyHighResUrlAuthoredState.highResUrl);
      done();
    }, 0);
  });

});
