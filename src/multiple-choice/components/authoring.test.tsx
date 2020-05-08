import React from "react";
import { mount, shallow } from "enzyme";
import { Authoring } from "./authoring";
import Form from "react-jsonschema-form";

const authoredState = {
  version: 1,
  prompt: "Test prompt",
  extraInstructions: "Test extra instructions",
  choices: [
    {id: "id1", content: "Choice A"},
    {id: "id2", content: "Choice B"}
  ]
};

describe("Authoring", () => {
  it("renders react-jsonschema-form and passes there authoredState", () => {
    const wrapper = shallow(<Authoring authoredState={authoredState} />);
    const formEl = wrapper.find(Form);
    expect(formEl.length).toEqual(1);
    expect(formEl.props().formData).toEqual(authoredState);
  });

  it("calls setAuthoredState on form change and generates unique IDs for choices (if missing)", () => {
    const setState = jest.fn();
    const wrapper = mount(<Authoring authoredState={authoredState} setAuthoredState={setState} />);
    const form = wrapper.find(Form).instance();
    const newState = {
      version: 1,
      prompt: "Test prompt",
      extraInstructions: "Test instructions",
      choices: [
        {content: "A", correct: true},
        {content: "B", correct: true}
      ]
    };
    // Mocked form, see __mocks__ dir.
    (form as any).triggerChange(newState);

    expect(setState).toHaveBeenCalledWith(expect.objectContaining(newState));
    const setStateArg = setState.mock.calls[0][0];
    expect(setStateArg.choices[0].id).toBeDefined();
    expect(setStateArg.choices[1].id).toBeDefined();
    expect(setStateArg.choices[0].id).not.toEqual(setStateArg.choices[1].id);
  });
});
