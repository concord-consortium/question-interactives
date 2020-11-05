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
