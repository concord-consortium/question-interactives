import React from "react";
import { mount } from "enzyme";
import { Slider } from "./slider";
import { IRenderedBar } from "../plugins/chart-info";

const renderedBar: IRenderedBar = {
  index: 0,
  value: 25,
  width: 40,
  top: 100,
  left: 10,
  center: 30,
  color: "#EA6D2F"
};

const renderSlider = (props: Partial<React.ComponentProps<typeof Slider>> = {}) =>
  mount(
    <Slider
      renderedBar={renderedBar}
      top={0}
      bottom={200}
      max={100}
      handleSliderChange={jest.fn()}
      label="Winter"
      valueText="25 Days of Sunlight"
      {...props}
    />
  );

describe("Slider accessibility", () => {
  it("associates the slider with its bar label via aria-label", () => {
    const node = renderSlider().find('[role="slider"]').getDOMNode();
    expect(node.getAttribute("aria-label")).toEqual("Winter");
  });

  it("announces the value with units via aria-valuetext", () => {
    const node = renderSlider().find('[role="slider"]').getDOMNode();
    expect(node.getAttribute("aria-valuetext")).toEqual("25 Days of Sunlight");
  });

  it("omits aria-valuetext when none is provided", () => {
    const node = renderSlider({ valueText: undefined }).find('[role="slider"]').getDOMNode();
    expect(node.hasAttribute("aria-valuetext")).toBe(false);
  });
});
