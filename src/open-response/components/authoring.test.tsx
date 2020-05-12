import React from "react";
import { mount, shallow } from "enzyme";
import { Authoring } from "./authoring";
import Form from "react-jsonschema-form";

const authoredState = {
  version: 1,
  prompt: "Test prompt",
  extraInstructions: "Test extra instructions",
  defaultAnswer: ""
};

describe("Authoring", () => {
  it("renders react-jsonschema-form and passes there authoredState", () => {
    const wrapper = shallow(<Authoring authoredState={authoredState} />);
    const formEl = wrapper.find(Form);
    expect(formEl.length).toEqual(1);
    expect(formEl.props().formData).toEqual(authoredState);
  });

  it("calls setAuthoredState on form change", () => {
    const setState = jest.fn();
    const wrapper = mount(<Authoring authoredState={authoredState} setAuthoredState={setState} />);
    const form = wrapper.find(Form).instance();
    const newState = {
      version: 1,
      prompt: "New prompt",
      extraInstructions: "Test instructions",
      defaultAnswer: "Example"
    };
    // Mocked form, see __mocks__ dir.
    (form as any).triggerChange(newState);

    expect(setState).toHaveBeenCalledWith(expect.objectContaining(newState));
  });
});
