import Slider from "rc-slider";
import React from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";

import { IWidgetComponentProps, SliderWidgetData } from "../types/widgets";
import { validateSliderWidgetData } from "../utils/validation-utils";
import { SliderReadout } from "./slider-readout";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

import css from "./slider-widget.scss";

export const sliderWidgetType = "slider";

export const SliderWidget = observer(function SliderWidget({ data, globalKey, sim, isRecording, inRecordingMode, isCompletedRecording, recordedGlobalValues }: IWidgetComponentProps<SliderWidgetData>) {
  const sliderBodyRef = React.useRef<HTMLDivElement>(null);

  // Clicks on the rc-slider element's container (not just the slider itself)
  // should move the slider handle to a position corresponding to the click.
  const handleSliderBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderBodyRef.current || isRecording || isCompletedRecording) return;

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
  // Use recorded values when viewing a completed recording, otherwise use current sim values
  const value = isCompletedRecording && recordedGlobalValues?.[globalKey] !== undefined
    ? recordedGlobalValues[globalKey]
    : sim.globals.get(globalKey);
  const error = validateSliderWidgetData(data, value, "Slider widget");
  if (error) return <WidgetError message={error} />;

  const handleChange = (newValue: number) => {
    sim.globals.set(globalKey, newValue);
  };

  const handleInputChange = (newValue: number) => {
    if (isRecording || isCompletedRecording) return;

    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      sim.globals.set(globalKey, clampedValue);
    }
  };

  return (
    <div className={classNames(css.sliderWidget, { [css.recording]: isRecording, [css.completedRecording]: isCompletedRecording, [css.inRecordingMode]: inRecordingMode })} data-testid="slider-widget-root">
      <div className={css.sliderHeader} data-testid="slider-widget-header">
        <span className={css.labelText} data-testid="slider-widget-label">
          {label}
        </span>
        {showReadout &&
          <SliderReadout 
            formatType={formatType}
            isCompletedRecording={isCompletedRecording}
            inRecordingMode={inRecordingMode}
            isRecording={isRecording}
            min={min}
            max={max}
            onChange={handleInputChange}
            precision={data.precision}
            step={step}
            unit={data.unit}
            value={value}
          />
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
          disabled={isRecording || isCompletedRecording}
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
