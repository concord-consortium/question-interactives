import React from "react";
import { mount, shallow } from "enzyme";
import { App } from "./app";
import { Runtime } from "./runtime";
import { Authoring } from "./authoring";

let mode: any;
jest.mock("../../shared/hooks/use-lara-interactive-api", () => ({
    useLARAInteractiveAPI: () => ({ mode, authoredState: {} })
  })
);

describe("App", () => {
  beforeEach(() => {
    mode = undefined;
  });

  it("should render Runtime or Authoring component depending on the mode", () => {
    mode = "runtime";
    let wrapper = shallow(<App />);
    expect(wrapper.find(Authoring).length).toEqual(0);
    expect(wrapper.find(Runtime).length).toEqual(1);

    mode = "authoring";
    wrapper = shallow(<App />);
    expect(wrapper.find(Authoring).length).toEqual(1);
    expect(wrapper.find(Runtime).length).toEqual(0);

    mode = "report";
    wrapper = shallow(<App />);
    expect(wrapper.find(Authoring).length).toEqual(0);
    expect(wrapper.find(Runtime).length).toEqual(1);
    expect(wrapper.find(Runtime).props().report).toEqual(true);
  });

  it("should listen to window resize event", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const wrapper = mount(<App />);
    expect(addSpy).toHaveBeenCalledWith("resize", expect.anything());
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.anything());
  });
});
