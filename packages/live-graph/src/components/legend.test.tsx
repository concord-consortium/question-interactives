import React from "react";
import { mount } from "enzyme";
import { Legend } from "./legend";
import { IActiveColumn } from "./use-live-stream";

const cols: IActiveColumn[] = [
  { column: "a", label: "Alpha" },
  { column: "b", label: "Beta" },
];

describe("Legend", () => {
  it("renders buttons with aria-pressed and type='button'", () => {
    const onToggle = jest.fn();
    const visibility = { a: true, b: false };
    const wrapper = mount(
      <Legend columns={cols} visibility={visibility} onToggle={onToggle} />
    );
    const buttons = wrapper.find("button");
    expect(buttons).toHaveLength(2);
    expect(buttons.at(0).prop("type")).toBe("button");
    expect(buttons.at(0).prop("aria-pressed")).toBe(true);
    expect(buttons.at(1).prop("aria-pressed")).toBe(false);
  });

  it("calls onToggle exactly once on mouse click", () => {
    const onToggle = jest.fn();
    const wrapper = mount(
      <Legend columns={cols} visibility={{ a: true, b: true }} onToggle={onToggle} />
    );
    wrapper.find("button").at(0).simulate("click");
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("a");
  });

  it("calls onToggle exactly once on Space keydown and prevents default", () => {
    const onToggle = jest.fn();
    const wrapper = mount(
      <Legend columns={cols} visibility={{ a: true, b: true }} onToggle={onToggle} />
    );
    const prevented = { called: false };
    wrapper.find("button").at(1).simulate("keydown", {
      key: " ",
      preventDefault: () => {
        prevented.called = true;
      },
    });
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("b");
    expect(prevented.called).toBe(true);
  });

  it("does not call onToggle on Enter keydown (handled by native click)", () => {
    const onToggle = jest.fn();
    const wrapper = mount(
      <Legend columns={cols} visibility={{ a: true, b: true }} onToggle={onToggle} />
    );
    wrapper.find("button").at(0).simulate("keydown", { key: "Enter" });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("calls onToggle exactly once when Enter triggers a native click on the button", () => {
    const onToggle = jest.fn();
    const wrapper = mount(
      <Legend columns={cols} visibility={{ a: true, b: true }} onToggle={onToggle} />
    );
    // Simulate the Enter keydown followed by the native click event that browsers fire
    wrapper.find("button").at(0).simulate("keydown", { key: "Enter" });
    wrapper.find("button").at(0).simulate("click");
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("a");
  });
});
