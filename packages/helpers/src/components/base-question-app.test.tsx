import React from "react";
import { mount } from "enzyme";
import { setSupportedFeatures, addFocusEnterListener } from "@concord-consortium/lara-interactive-api";
import { BaseQuestionApp } from "./base-question-app";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(() => initMessage),
  useAuthoredState: jest.fn(() => useAuthoredStateResult),
  useInteractiveState: jest.fn(() => ({})),
  setSupportedFeatures: jest.fn(),
  addFocusEnterListener: jest.fn(),
  removeFocusEnterListener: jest.fn(),
  sendFocusExit: jest.fn(),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
  useAccessibility: jest.fn(() => useAccessibilityResult),
}));

const setSupportedFeaturesMock = setSupportedFeatures as jest.Mock;
const addFocusEnterListenerMock = addFocusEnterListener as jest.Mock;

let initMessage = {};
let useAuthoredStateResult = {};
let useAccessibilityResult = {};

describe("BaseApp", () => {
  beforeEach(() => {
    initMessage = {};
    useAuthoredStateResult = { authoredState: {}, setAuthoredState: jest.fn() };
  });

  it("declares focusProtocol and enables the hook at runtime when focusProtocol is set", () => {
    initMessage = { mode: "runtime" };
    setSupportedFeaturesMock.mockClear();
    addFocusEnterListenerMock.mockClear();

    const Runtime = () => null;
    mount(<BaseQuestionApp Runtime={Runtime} disableSubmitBtnRendering={true} focusProtocol={true} />);

    expect(setSupportedFeaturesMock).toHaveBeenCalledWith(
      expect.objectContaining({ focusProtocol: true })
    );
    expect(addFocusEnterListenerMock).toHaveBeenCalled();
  });

  it("does not declare focusProtocol when the prop is not set", () => {
    initMessage = { mode: "runtime" };
    setSupportedFeaturesMock.mockClear();
    addFocusEnterListenerMock.mockClear();

    const Runtime = () => null;
    mount(<BaseQuestionApp Runtime={Runtime} disableSubmitBtnRendering={true} />);

    expect(setSupportedFeaturesMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ focusProtocol: true })
    );
    expect(addFocusEnterListenerMock).not.toHaveBeenCalled();
  });

  it("applies authored state migrations in runtime mode", () => {
    useAuthoredStateResult = { authoredState: {
        version: 1,
        foo: "bar"
      }, setAuthoredState: jest.fn() };
    initMessage = { mode: "runtime" };

    const migrate = (oldState: any) => ({
      ...oldState,
      version: 2,
      newProp: "123"
    });

    const Runtime = () => null;
    const wrapper = mount(<BaseQuestionApp Runtime={Runtime} migrateAuthoredState={migrate} disableSubmitBtnRendering={true} />);

    expect(wrapper.find(Runtime).length).toEqual(1);
    expect(wrapper.find(Runtime).prop("authoredState")).toEqual({
      version: 2,
      foo: "bar",
      newProp: "123"
    });
  });

  it("shows 'Authored state is missing.' in runtime mode when authored state is missing", () => {
    useAuthoredStateResult = { authoredState: null, setAuthoredState: jest.fn() };
    initMessage = { mode: "runtime" };

    const Runtime = () => null;
    const wrapper = mount(<BaseQuestionApp Runtime={Runtime} disableSubmitBtnRendering={true} />);

    expect(wrapper.find(Runtime).length).toEqual(0);
    expect(wrapper.text()).toContain("Authored state is missing.");
  });

  it("renders runtime with empty authored state when allowEmptyAuthoredStateAtRuntime is true", () => {
    useAuthoredStateResult = { authoredState: null, setAuthoredState: jest.fn() };
    initMessage = { mode: "runtime" };

    const Runtime = () => null;
    const wrapper = mount(<BaseQuestionApp Runtime={Runtime} disableSubmitBtnRendering={true} allowEmptyAuthoredStateAtRuntime={true} />);

    expect(wrapper.find(Runtime).length).toEqual(1);
    expect(wrapper.find(Runtime).prop("authoredState")).toEqual({});
  });

  it("shows 'Authored state is missing.' in report mode when authored state is missing", () => {
    useAuthoredStateResult = { authoredState: null, setAuthoredState: jest.fn() };
    initMessage = { mode: "report" };

    const Runtime = () => null;
    const wrapper = mount(<BaseQuestionApp Runtime={Runtime} disableSubmitBtnRendering={true} />);

    expect(wrapper.find(Runtime).length).toEqual(0);
    expect(wrapper.text()).toContain("Authored state is missing.");
  });

  it("renders report with empty authored state when allowEmptyAuthoredStateAtRuntime is true", () => {
    useAuthoredStateResult = { authoredState: null, setAuthoredState: jest.fn() };
    initMessage = { mode: "report" };

    const Runtime = () => null;
    const wrapper = mount(<BaseQuestionApp Runtime={Runtime} disableSubmitBtnRendering={true} allowEmptyAuthoredStateAtRuntime={true} />);

    expect(wrapper.find(Runtime).length).toEqual(1);
    expect(wrapper.find(Runtime).prop("authoredState")).toEqual({});
    expect(wrapper.find(Runtime).prop("report")).toEqual(true);
  });

  it("applies authored state migrations in authoring mode", () => {
    useAuthoredStateResult = { authoredState: {
        version: 1,
        foo: "bar"
      }, setAuthoredState: jest.fn() };
    initMessage = { mode: "authoring" };

    const migrate = (oldState: any) => ({
      ...oldState,
      version: 2,
      newProp: "123"
    });

    const Runtime = () => null;
    const Authoring = () => null;
    const wrapper = mount(<BaseQuestionApp Runtime={Runtime} Authoring={Authoring} migrateAuthoredState={migrate} disableSubmitBtnRendering={true} />);

    expect(wrapper.find(Authoring).length).toEqual(1);
    expect(wrapper.find(Authoring).prop("authoredState")).toEqual({
      version: 2,
      foo: "bar",
      newProp: "123"
    });
  });
});
