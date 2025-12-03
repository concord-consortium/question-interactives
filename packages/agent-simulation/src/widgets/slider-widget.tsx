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
      sim.globals.set(globalKey, newValue);
    }
  };

  const formattedValue = formatValue(value, data.formatType, data.precision);
  const unit = formatType === "percent" ? "%" : (data?.unit ?? "");
  const inputWidth = Math.min(formattedValue.length + 1, MAX_INPUT_WIDTH_CH);

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
              min={min}
              max={max}
              step={step}
              style={{ width: `${inputWidth}ch` }}
              type="number"
              value={formattedValue}
              onChange={handleInputChange}
              disabled={isRecording}
            />
            {unit && <span className={css.unit} data-testid="slider-widget-unit">{unit}</span>}
          </div>
        }
        {secondaryLabel && <span className={css.secondaryLabelText} data-testid="slider-widget-secondary-label">{secondaryLabel}</span>}
      </div>
      <div className={css.sliderBody} data-testid="slider-widget-slider-body">
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
