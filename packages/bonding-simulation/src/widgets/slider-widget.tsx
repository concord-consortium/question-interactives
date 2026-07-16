import Slider from "rc-slider";
import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps, SliderWidgetData } from "../types/widgets";
import { validateSliderWidgetData } from "../utils/validation-utils";
import { SliderReadout } from "./slider-readout";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

import css from "./slider-widget.scss";

export const sliderWidgetType = "slider";

export const SliderWidget = observer(function SliderWidget({ data, globalKey, globals }: IWidgetComponentProps<SliderWidgetData>) {
  const sliderBodyRef = React.useRef<HTMLDivElement>(null);

  if (!data) {
    return <WidgetError message="Slider widget is missing data configuration." />;
  }

  const { formatType, icon, label, min, max, secondaryLabel, showReadout, step } = data;
  const value = globals.get(globalKey);
  const error = validateSliderWidgetData(data, value, "Slider widget");
  if (error) return <WidgetError message={error} />;

  const handleChange = (newValue: number) => {
    globals.set(globalKey, newValue);
  };

  const handleInputChange = (newValue: number) => {
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      globals.set(globalKey, clampedValue);
    }
  };

  const handleSliderBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderBodyRef.current) return;
    const rect = sliderBodyRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;
    const percent = Math.max(0, Math.min(1, clickX / trackWidth));
    let newValue = min + percent * (max - min);
    if (step && step > 0) {
      newValue = Math.round((newValue - min) / step) * step + min;
    }
    newValue = Math.max(min, Math.min(max, newValue));
    handleChange(newValue);
  };

  return (
    <div className={css.sliderWidget} data-testid="slider-widget-root">
      <div className={css.sliderHeader} data-testid="slider-widget-header">
        <span className={css.labelText} data-testid="slider-widget-label">
          {icon && <img src={icon} alt="" style={{ width: 20, height: 20, verticalAlign: "middle", marginRight: 4 }} />}
          {label}
        </span>
        {showReadout &&
          <SliderReadout
            formatType={formatType}
            isCompletedRecording={false}
            inRecordingMode={false}
            isRecording={false}
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
