import React from "react";
import { shallow } from "enzyme";
import { insertInputs, Runtime } from "./runtime";

const authoredState = {
  version: 1,
  prompt: "Test prompt with [blank-1] and [blank-2].",
  blanks: [
    {id: "[blank-1]", size: 10},
    {id: "[blank-2]", size: 20, matchTerm: "Expected answer"}
  ]
};

const interactiveState = {
  blanks: [
    {id: "[blank-1]", response: "Test response"}
  ]
};

describe("Runtime", () => {
  it("renders prompt and inputs", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining("Test prompt with "));
    expect(wrapper.find("input").length).toEqual(2);
    expect(wrapper.find("input").at(0).props().size).toEqual(10);
    expect(wrapper.find("input").at(1).props().size).toEqual(20);
  });

  it("handles passed interactiveState", () => {
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} />);
    expect(wrapper.find("input").at(0).props().value).toEqual(interactiveState.blanks[0].response);
    expect(wrapper.find("input").at(1).props().value).toEqual(undefined);
  });

  it("calls setInteractiveState when user provides an answer", () => {
    const setState = jest.fn();
    const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} />);
    wrapper.find("input").at(1).simulate("change", { target: { value: "New response" } });
    expect(setState).toHaveBeenCalledWith({
      blanks: [
        {id: "[blank-1]", response: "Test response"},
        {id: "[blank-2]", response: "New response"}
      ]
    });
  });

  describe("report mode", () => {
    it("renders prompt and *disabled* inputs", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} report={true} />);
      expect(wrapper.text()).toEqual(expect.stringContaining("Test prompt with "));
      expect(wrapper.find("input").length).toEqual(2);
      expect(wrapper.find("input").at(0).props().disabled).toEqual(true);
      expect(wrapper.find("input").at(1).props().disabled).toEqual(true);
    });

    it("handles passed interactiveState", () => {
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} report={true} />);
      expect(wrapper.find("input").at(0).props().value).toEqual(interactiveState.blanks[0].response);
      expect(wrapper.find("input").at(1).props().value).toEqual(undefined);
    });

    it("never calls setInteractiveState when user selects an answer", () => {
      const setState = jest.fn();
      const wrapper = shallow(<Runtime authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setState} report={true} />);
      wrapper.find("input").at(0).simulate("change", { target: { value: "diff answer" } });
      wrapper.find("input").at(1).simulate("change", { target: { value: "diff answer" } });
      expect(setState).not.toHaveBeenCalled();
    });
  });
});

describe("insertInputs helper", () => {
  it("returns array of strings and input field descriptions", () => {
    const result = insertInputs(authoredState.prompt, authoredState.blanks, interactiveState.blanks);
    expect(result).toEqual([
      "Test prompt with ",
      {id: "[blank-1]", size: 10, matchTerm: undefined, value: "Test response"},
      " and ",
      {id: "[blank-2]", size: 20, matchTerm: "Expected answer", value: undefined},
      "."
    ])
  });
});
