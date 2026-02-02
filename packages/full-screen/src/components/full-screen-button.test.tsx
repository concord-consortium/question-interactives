import React from "react";
import { mount } from "enzyme";
import { FullScreenButton } from "./full-screen-button";

describe("FullScreenButton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a button", () => {
    const handleToggle = jest.fn();
    const wrapper = mount(<FullScreenButton isFullScreen={false} handleToggleFullScreen={handleToggle} />);
    expect(wrapper.find("button").length).toBe(1);
  });

  it("calls handleToggleFullScreen when button is clicked", () => {
    const handleToggle = jest.fn();
    const wrapper = mount(<FullScreenButton isFullScreen={false} handleToggleFullScreen={handleToggle} />);
    wrapper.find("button").simulate("click");
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("shows fullscreen hint initially", () => {
    const wrapper = mount(<FullScreenButton isFullScreen={false} handleToggleFullScreen={jest.fn()} />);
    expect(wrapper.text()).toContain("Click here to enter/exit fullscreen");
  });

  it("hides hint after 4 seconds", () => {
    const wrapper = mount(<FullScreenButton isFullScreen={false} handleToggleFullScreen={jest.fn()} />);
    jest.advanceTimersByTime(4000);
    wrapper.update();
    // The hint gets a 'hidden' CSS class after timeout
    expect(wrapper.find("#fullScreenHelp").hasClass("hidden")).toBe(true);
  });

  it("applies fullscreen CSS class when isFullScreen is true", () => {
    const wrapper = mount(<FullScreenButton isFullScreen={true} handleToggleFullScreen={jest.fn()} />);
    expect(wrapper.find("button").hasClass("fullscreen")).toBe(true);
  });

  it("does not apply fullscreen CSS class when isFullScreen is false", () => {
    const wrapper = mount(<FullScreenButton isFullScreen={false} handleToggleFullScreen={jest.fn()} />);
    expect(wrapper.find("button").hasClass("fullscreen")).toBe(false);
  });
});
