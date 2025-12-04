import Slider from "rc-slider";
import React from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";

import { IWidgetComponentProps, SliderWidgetData } from "../types/widgets";
import { formatValue } from "../utils/format-utils";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

import css from "./slider-widget.scss";

export const sliderWidgetType = "slider";
const MAX_INPUT_WIDTH_CH = 5;

export const SliderWidget = observer(function SliderWidget({ data, globalKey, sim, isRecording, inRecordingMode }: IWidgetComponentProps<SliderWidgetData>) {
  const sliderBodyRef = React.useRef<HTMLDivElement>(null);

  // Clicks on the rc-slider element's container (not just the slider itself)
  // should move the slider handle to a position corresponding to the click.
  const handleSliderBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderBodyRef.current || isRecording) return;

    const rect = sliderBodyRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;
    let percent = clickX / trackWidth;
    percent = Math.max(0, Math.min(1, percent));
    let newValue = min + percent * (max - min);
    if (step && step > 0) {
      newValue = Math.round((newValue - min) / step) * step + min;
    }
    newValue = Math.max(min, Math.min(max, newValue));

    handleChange(newValue);
  };

  if (!data) {
    return <WidgetError message="Slider widget is missing data configuration." />;
  }

  const { formatType, label, min, max, secondaryLabel, showReadout, step } = data;
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return <WidgetError message="Slider widget requires numeric min and max values in its data configuration." />;
  }
  if (min >= max) {
    return <WidgetError message="Slider widget requires min value to be less than max value." />;
  }
  if (!label) {
    return <WidgetError message="Slider widget requires a label in its data configuration." />;
  }
  if (step !== undefined && (!Number.isFinite(step) || step <= 0)) {
    return <WidgetError message="Slider widget step must be a positive number." />;
  }

  const value = sim.globals.get(globalKey);
  if (!Number.isFinite(value)) {
    return <WidgetError message={`Slider widget requires a global with a numeric value.`} />;
  }

  const handleChange = (newValue: number) => {
    sim.globals.set(globalKey, newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      sim.globals.set(globalKey, clampedValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Return") {
      e.currentTarget.blur();
    }
  };

  const formattedValue = formatValue(value, data.formatType, data.precision);
  const unit = formatType === "percent" ? "%" : (data?.unit ?? "");
  // Set input width based on max value length to prevent layout shifts.
  const inputWidth = Math.min(max.toString().length + 1, MAX_INPUT_WIDTH_CH);

  return (
    <div className={classNames(css.sliderWidget, { [css.recording]: isRecording, [css.inRecordingMode]: inRecordingMode })} data-testid="slider-widget-root">
      <div className={css.sliderHeader} data-testid="slider-widget-header">
        <span className={css.labelText} data-testid="slider-widget-label">
          {label}
        </span>
        {showReadout &&
          <div className={css.valueContainer} data-testid="slider-widget-value-container">
            <input
              className={css.valueInput}
              data-testid="slider-widget-input"
              disabled={isRecording}
              min={min}
              max={max}
              step={step}
              style={{ width: `${inputWidth}ch` }}
              type="number"
              value={formattedValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
            />
            {unit && <span className={css.unit} data-testid="slider-widget-unit">{unit}</span>}
          </div>
        }
        {secondaryLabel && <span className={css.secondaryLabelText} data-testid="slider-widget-secondary-label">{secondaryLabel}</span>}
      </div>
      <div
        className={css.sliderBody}
        data-testid="slider-widget-slider-body"
        ref={sliderBodyRef}
        onClick={handleSliderBodyClick}
      >
        <Slider
          className={css.rcSlider}
          min={min}
          max={max}
          onChange={handleChange}
          step={step}
          value={value}
          disabled={isRecording}
        />
      </div>
    </div>
  );
});

registerWidget({
  component: SliderWidget,
  size: "tall",
  type: sliderWidgetType
});
