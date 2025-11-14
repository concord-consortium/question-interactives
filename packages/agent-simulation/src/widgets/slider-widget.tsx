import Slider from "rc-slider";
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

import css from "./slider-widget.scss";

export const sliderWidgetType = "slider";

const SliderWidget = observer(function SliderWidget({ data, defaultValue, globalKey, sim }: IWidgetComponentProps) {
  // Set up the global if it doesn't already exist
  useEffect(() => {
    if (typeof defaultValue !== "number") return;

    sim.globals.createGlobal(globalKey, { displayName: data?.label, value: defaultValue });
  }, [data?.label, defaultValue, globalKey, sim.globals]);

  if (!data) return <WidgetError message="Slider widget is missing data configuration." />;
  
  const { min, max } = data;

  if (typeof min !== "number" || typeof max !== "number") {
    return <WidgetError message="Slider widget requires numeric min and max values in its data configuration." />;
  }
  if (min >= max) {
    return <WidgetError message="Slider widget requires min value to be less than max value." />;
  }

  const value = sim.globals.getValue(globalKey);
  if (typeof value !== "number") {
    return <WidgetError message={`Slider widget requires a global with a numeric value.`} />;
  }

  const handleChange = (newValue: number) => {
    sim.globals.setValue(globalKey, newValue);
  };

  return (
    <div>
      {data?.label ?? sim.globals.getDisplayName(globalKey)}
      <Slider
        className={css.rcSlider}
        min={min}
        max={max}
        onChange={handleChange}
        value={value}
        // It would be better to define styles in css, but I couldn't figure out how to do it in the qi repo
        styles={{
          handle: {
            position: "absolute",
            top: "5px",
            width: "15px",
            height: "15px",
            border: "solid 2px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            cursor: "grab",
            touchAction: "pan-x",
            zIndex: 2
          },
          rail: {
            position: "absolute",
            width: "95%",
            height: "2px",
            backgroundColor: "#949494"
          },
          track: {
            position: "relative",
            width: "95%",
            height: "4px",
            top: "-1px",
            backgroundColor: "#545454",
            borderRadius: "1px",
          }
        }}
      />
    </div>
  );
});

registerWidget({
  component: SliderWidget,
  type: sliderWidgetType
});
