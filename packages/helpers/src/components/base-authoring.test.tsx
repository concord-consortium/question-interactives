import React from "react";
import { mount, shallow } from "enzyme";
import { BaseAuthoring, getTokenServiceEnv } from "./base-authoring";
import { RJSFSchema } from "@rjsf/utils";
import Form from "@rjsf/core";
import { useLinkedInteractivesAuthoring } from "../hooks/use-linked-interactives-authoring";

let useAccessibilityResult = {};
let getFirebaseJwtResult = {};

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getFirebaseJwt: jest.fn(() => getFirebaseJwtResult),
  useAccessibility: jest.fn(() => useAccessibilityResult),
}));

jest.mock("../hooks/use-linked-interactives-authoring", () => ({
  useLinkedInteractivesAuthoring: jest.fn((props: any) => [props.schema, props.uiSchema])
}));

const useLinkedInteractivesAuthoringMock = useLinkedInteractivesAuthoring as jest.Mock;

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
} as RJSFSchema;

const authoredState = {
  version: 1,
  testValue: "123"
};

describe("BaseAuthoring", () => {
  beforeEach(() => {
    useLinkedInteractivesAuthoringMock.mockClear();
  });

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
    expect(formEl.props().customValidate).toEqual(validate);
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

  it("uses useLinkedInteractivesHook", () => {
    mount(<BaseAuthoring<ITestAuthoredState>
        authoredState={authoredState}
        setAuthoredState={jest.fn()}
        schema={schema}
    />);
    expect(useLinkedInteractivesAuthoringMock).toHaveBeenCalled();
  });
});

describe("getTokenServiceEnv", () => {
  it("returns production only for learn.concord.org", () => {
    expect(getTokenServiceEnv({platform_id: "https://learn.concord.org"})).toEqual("production");

    expect(getTokenServiceEnv({platform_id: "https://example.com"})).toEqual("staging");
    expect(getTokenServiceEnv({platform_id: "https://learn.staging.concord.org"})).toEqual("staging");
  });
});
