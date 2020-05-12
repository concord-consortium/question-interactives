import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";

const authoredState = {
  version: 1,
  prompt: "Test prompt",
  extraInstructions: "Test extra instructions",
  defaultAnswer: ""
};

const interactiveState = {
  response: "Test response"
};

describe("Runtime", () => {
  it("renders prompt, extra instructions and textarea", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.extraInstructions));
    expect(wrapper.find("textarea").length).toEqual(1);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.find("textarea").props().value).toEqual(interactiveState.response);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    wrapper.find("textarea").simulate("change", { target: { value: "new response" } });
    expect(setState).toHaveBeenCalledWith({response: "new response"});
  });

  describe("report mode", () => {
    it("renders prompt, extra instructions and *disabled* textarea", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} report={true} />);
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.extraInstructions));
      expect(wrapper.find("textarea").props().disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find("textarea").props().value).toEqual(interactiveState.response);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} />);
      wrapper.find("textarea").simulate("change", { target: { value: "diff answer" } });
      expect(setState).not.toHaveBeenCalled();
    });
  });
});
