import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { SliderReadout } from "./slider-readout";

describe("SliderReadout", () => {
  const baseProps = {
    min: 0,
    max: 100,
    value: 50,
    onChange: jest.fn()
  };

  it("renders input and unit", () => {
    render(<SliderReadout {...baseProps} unit="kg" />);
    expect(screen.getByTestId("slider-widget-input")).toBeInTheDocument();
    expect(screen.getByTestId("slider-widget-unit")).toHaveTextContent("kg");
  });

  it("renders input without unit when unit is not specified", () => {
    render(<SliderReadout {...baseProps} />);
    expect(screen.getByTestId("slider-widget-input")).toBeInTheDocument();
    expect(screen.queryByTestId("slider-widget-unit")).toBeNull();
  });

  it("shows value", () => {
    render(<SliderReadout {...baseProps} value={42} />);
    expect(screen.getByTestId("slider-widget-input")).toHaveValue(42);
  });

  it("shows percent value and percent sign when formatType is percent", () => {
    render(<SliderReadout {...baseProps} value={.5} formatType="percent" />);
    expect(screen.getByTestId("slider-widget-input")).toHaveValue(50);
    expect(screen.getByTestId("slider-widget-unit")).toHaveTextContent("%");
  });

  it("sizes input based on max value four characters long", () => {
    render(<SliderReadout {...baseProps} max={9999} />);
    const input = screen.getByTestId("slider-widget-input");
    expect(input).toHaveStyle({ width: "5ch" });
  });

  it("sizes input based on max value two characters long", () => {
    render(<SliderReadout {...baseProps} max={99} />);
    const input = screen.getByTestId("slider-widget-input");
    expect(input).toHaveStyle({ width: "3ch" });
  });

  it("calls onChange with value after debounce delay", () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(<SliderReadout {...baseProps} onChange={onChange} />);
    const input = screen.getByTestId("slider-widget-input");
    fireEvent.change(input, { target: { value: "77" } });
    // onChange should not be called immediately due to debouncing
    expect(onChange).not.toHaveBeenCalled();
    // Advance timers past the debounce delay (750ms).
    act(() => {
      jest.advanceTimersByTime(750);
    });
    expect(onChange).toHaveBeenCalledWith(77);
    jest.useRealTimers();
  });

  it("calls onChange immediately on blur", () => {
    const onChange = jest.fn();
    render(<SliderReadout {...baseProps} onChange={onChange} />);
    const input = screen.getByTestId("slider-widget-input");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "77" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(77);
  });

  it("updates input to clamped value after debounce when value exceeds max", () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(<SliderReadout {...baseProps} onChange={onChange} />);
    const input = screen.getByTestId("slider-widget-input") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "150" } });
    expect(input.value).toBe("150");
    act(() => {
      jest.advanceTimersByTime(750);
    });
    expect(onChange).toHaveBeenCalledWith(150);
    expect(input.value).toBe("100");
    jest.useRealTimers();
  });

  it("disables input when `isRecording` is true", () => {
    render(<SliderReadout {...baseProps} isRecording={true} />);
    expect(screen.getByTestId("slider-widget-input")).toBeDisabled();
  });

  it("disables input when `isCompletedRecording` is true", () => {
    render(<SliderReadout {...baseProps} isCompletedRecording={true} />);
    expect(screen.getByTestId("slider-widget-input")).toBeDisabled();
  });

  it("blurs input on Enter key", () => {
    render(<SliderReadout {...baseProps} />);
    const input = screen.getByTestId("slider-widget-input");
    input.focus();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(document.activeElement).not.toBe(input);
  });
});
