import React from "react";
import { mount } from "enzyme";
import { Runtime } from "./runtime";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt"
};

describe("Runtime", () => {
  it("renders prompt and container", () => {
    const wrapper = mount(<DynamicTextTester><Runtime authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.find(ContainerWithDndProvider).length).toEqual(1);
  });
});
