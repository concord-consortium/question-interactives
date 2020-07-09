import React from "react";
import { shallow } from "enzyme";
import { Runtime } from "./runtime";

const authoredState = {
  version: 1,
  questionType: "open_response" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  defaultAnswer: ""
};

const authoredRichState = {
  ...authoredState,
  prompt: "<p><strong>Rich</strong> <em>text</em> <u>prompt</u>"
};

const interactiveState = {
  answerType: "open_response_answer" as const,
  answerText: "Test answer",
};

describe("Runtime", () => {
  it("renders prompt and textarea", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    const prompt = wrapper.find("legend");
    expect(prompt.html()).toEqual(expect.stringContaining(authoredState.prompt));
    expect(wrapper.find("textarea").length).toEqual(1);
  });

  it("renders rich text prompt and textarea", () => {
    const wrapper = shallow(<Runtime authoredState={authoredRichState} />);
    const prompt = wrapper.find("legend");
    expect(prompt.html()).toEqual(expect.stringContaining(authoredRichState.prompt));
    expect(wrapper.find("textarea").length).toEqual(1);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.find("textarea").props().value).toEqual(interactiveState.answerText);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    wrapper.find("textarea").simulate("change", { target: { value: "new answer" } });
    const newState = setState.mock.calls[0][0](interactiveState);
    expect(newState).toEqual({answerType: "open_response_answer", answerText: "new answer"});
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* textarea", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} report={true} />);
      const prompt = wrapper.find("legend");
      expect(prompt.html()).toEqual(expect.stringContaining(authoredState.prompt));
      expect(wrapper.find("textarea").props().disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find("textarea").props().value).toEqual(interactiveState.answerText);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} />);
      wrapper.find("textarea").simulate("change", { target: { value: "diff answer" } });
      expect(setState).not.toHaveBeenCalled();
    });
  });
});
