import React from "react";
import { mount } from "enzyme";
import { BaseApp } from "./base-app";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(() => initMessage),
  useAuthoredState: jest.fn(() => useAuthoredStateResult),
  useInteractiveState: jest.fn(() => ({})),
  setSupportedFeatures: jest.fn()
}));

let initMessage = {};
let useAuthoredStateResult = {};

describe("BaseApp", () => {
  beforeEach(() => {
    initMessage = {};
    useAuthoredStateResult = { authoredState: {}, setAuthoredState: jest.fn() };
  });

  it("renders 'Loading...' when mode is not yet set", () => {
    useAuthoredStateResult = { authoredState: {
        version: 1,
        foo: "bar"
      }, setAuthoredState: jest.fn() };
    initMessage = { mode: undefined };

    const Runtime = () => null;
    const wrapper = mount(<BaseApp Runtime={Runtime} />);

    expect(wrapper.text()).toEqual("Loading...");
  });

  it("renders authoring when mode is set to 'authoring'", () => {
    useAuthoredStateResult = { authoredState: {
        version: 1,
        foo: "bar"
      }, setAuthoredState: jest.fn() };
    initMessage = { mode: "authoring" };

    const Authoring = () => null;
    const Runtime = () => null;
    const wrapper = mount(<BaseApp Authoring={Authoring} Runtime={Runtime} />);

    expect(wrapper.find(Authoring).length).toEqual(1);
    expect(wrapper.find(Authoring).prop("authoredState")).toEqual({
      version: 1,
      foo: "bar"
    });
  });

  it("returns an error when authoredState is not set", () => {
    useAuthoredStateResult = { authoredState: null, setAuthoredState: jest.fn() };
    initMessage = { mode: "runtime" };

    const Runtime = () => null;
    const wrapper = mount(<BaseApp Runtime={Runtime} />);

    expect(wrapper.find(Runtime).length).toEqual(0);
    expect(wrapper.text()).toEqual("Authored state is missing.");
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
    const wrapper = mount(<BaseApp Runtime={Runtime} migrateAuthoredState={migrate} />);

    expect(wrapper.find(Runtime).length).toEqual(1);
    expect(wrapper.find(Runtime).prop("authoredState")).toEqual({
      version: 2,
      foo: "bar",
      newProp: "123"
    });
  });
});
