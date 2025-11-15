import Slider from "rc-slider";
import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

import css from "./slider-widget.scss";
import { useInitializeGlobal } from "./use-initialize-global";

export const sliderWidgetType = "slider";

const SliderWidget = observer(function SliderWidget({ data, defaultValue, globalKey, sim }: IWidgetComponentProps) {
  useInitializeGlobal({ defaultValue, globalKey, requiredType: "number", sim });

  if (!data) return <WidgetError message="Slider widget is missing data configuration." />;
  
  const { min, max } = data;

  if (typeof min !== "number" || typeof max !== "number") {
    return <WidgetError message="Slider widget requires numeric min and max values in its data configuration." />;
  }
  if (min >= max) {
    return <WidgetError message="Slider widget requires min value to be less than max value." />;
  }

  const value = sim.globals.get(globalKey);
  if (typeof value !== "number") {
    return <WidgetError message={`Slider widget requires a global with a numeric value.`} />;
  }

  const handleChange = (newValue: number) => {
    sim.globals.set(globalKey, newValue);
  };

  return (
    <div>
      {data?.label}
      <Slider
        className={css.rcSlider}
        min={min}
        max={max}
        onChange={handleChange}
        value={value}
      />
    </div>
  );
});

registerWidget({
  component: SliderWidget,
  type: sliderWidgetType
});
