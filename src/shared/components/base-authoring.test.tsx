import React from "react";
import { mount, shallow } from "enzyme";
import { BaseAuthoring } from "./base-authoring";
import { JSONSchema6 } from "json-schema";
import Form from "react-jsonschema-form";

interface ITestAuthoredState {
  version: number;
  testValue: string;
}

const schema = {
  type: "object",
  properties: {
    version: {
      type: "number",
      default: 1
    },
    testValue: {
      title: "Test Value",
      type: "string"
    }
  }
} as JSONSchema6;

const authoredState = {
  version: 1,
  testValue: "123"
};

describe("BaseAuthoring", () => {
  it("renders react-jsonschema-form and passes the authoredState", () => {
    const setState = jest.fn();
    const uiSchema = {};
    const fields = {
      testField: () => null
    };
    const validate = jest.fn();
    const wrapper = shallow(<BaseAuthoring<ITestAuthoredState>
      authoredState={authoredState}
      setAuthoredState={setState}
      schema={schema}
      uiSchema={uiSchema}
      fields={fields}
      validate={validate}
    />);
    const formEl = wrapper.find(Form);
    expect(formEl.length).toEqual(1);
    expect(formEl.props().formData).toEqual(authoredState);
    expect(formEl.props().schema).toEqual(schema);
    expect(formEl.props().uiSchema).toEqual(uiSchema);
    expect(formEl.props().fields).toEqual(fields);
    expect(formEl.props().validate).toEqual(validate);
  });

  it("calls setAuthoredState on form change and uses preprocessFormData function", () => {
    const setState = jest.fn();
    const preprocess = (data: ITestAuthoredState) => {
      data.testValue = data.testValue + "!!!";
      return data;
    };
    const wrapper = mount(<BaseAuthoring<ITestAuthoredState>
      authoredState={authoredState}
      setAuthoredState={setState}
      schema={schema}
      preprocessFormData={preprocess}
    />);
    const form = wrapper.find(Form).instance();
    const newState: ITestAuthoredState = {
      version: 1,
      testValue: "New test value"
    };
    // Mocked form, see __mocks__ dir.
    (form as any).triggerChange(newState);

    expect(setState).toHaveBeenCalledWith({
      version: 1,
      testValue: "New test value!!!"
    });
  });
});
