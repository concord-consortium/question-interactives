import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt"
};

describe("Runtime", () => {
  it("renders prompt and container", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.find(ContainerWithDndProvider).length).toEqual(1);
  });
});
