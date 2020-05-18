import React from "react";
import { mount, shallow } from "enzyme";
import { Authoring, IAuthoredState, defaultBlankSize, validate } from "./authoring";
import Form, { FormValidation } from "react-jsonschema-form";

const authoredState = {
  version: 1,
  prompt: "Test prompt with [blank-1] and [blank-2]",
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

  it("calls setAuthoredState on form change and generates missing blank options", () => {
    const setState = jest.fn();
    const wrapper = mount(<Authoring authoredState={authoredState} setAuthoredState={setState} />);
    const form = wrapper.find(Form).instance();
    const newState: IAuthoredState = {
      version: 1,
      prompt: "New prompt with [blank-1] and [blank-2]",
      extraInstructions: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10}
      ]
    };
    // Mocked form, see __mocks__ dir.
    (form as any).triggerChange(newState);

    expect(setState).toHaveBeenCalledWith({
      version: 1,
      prompt: "New prompt with [blank-1] and [blank-2]",
      extraInstructions: "Test instructions",
      blanks: [
        {id: "[blank-1]", size: 10},
        {id: "[blank-2]", size: defaultBlankSize}
      ]
    });
  });
});

describe("validation helper", () => {
  it("adds error when there are two blanks with the same ID", () => {
    const errors = {
      prompt: {
        addError: jest.fn()
      }
    } as unknown as FormValidation;
    validate({ version: 1, prompt: "test [blank-1], [blank-2], and [blank-3]"}, errors);
    expect(errors.prompt.addError).not.toHaveBeenCalled();

    validate({ version: 1, prompt: "test [blank-1], [blank-2], and [blank-1]"}, errors);
    expect(errors.prompt.addError).toHaveBeenCalledWith("The same blank ID used multiple times: [blank-1]");
  })
});
