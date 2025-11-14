import Slider from "rc-slider";
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { registerWidget } from "./widget-registration";

import css from "./slider-widget.scss";

export const sliderWidgetType = "slider";

const SliderWidget = observer(function SliderWidget({ data, defaultValue, global, sim }: IWidgetComponentProps) {
  // Set up the global if it doesn't already exist
  useEffect(() => {
    sim.globals.createGlobal(global, { displayName: data?.label, value: defaultValue });
  }, [data?.label, defaultValue, global, sim.globals]);

  const handleChange = (value: number) => {
    sim.globals.setValue(global, value);
  };

  return (
    <div>
      {data?.label}
      <Slider
        className={css.rcSlider}
        min={data?.min ?? 0}
        max={data?.max ?? 100}
        onChange={handleChange}
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
        value={sim.globals.getValue(global)}
      />
    </div>
  );
});

registerWidget({
  component: SliderWidget,
  type: sliderWidgetType
});
