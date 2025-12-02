import React from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";

import { IWidgetComponentProps } from "../types/widgets";
import { registerWidget } from "./widget-registration";

import css from "./readout-widget.scss";

export const readoutWidgetType = "readout";

const sanitizeGlobalKey = (str: string) => {
  return str.replace(/[^a-zA-Z0-9\-_:.]/g, "_");
};

export const ReadoutWidget = observer(function ReadoutWidget({ data, defaultValue, globalKey, sim, isRecording }: IWidgetComponentProps) {
  const labelString = data?.label ? ` ${data.label}` : "";
  const sanitizedGlobalKey = sanitizeGlobalKey(globalKey);
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  return (
    <div className={classNames(css.readoutWidget, { [css.recording]: isRecording })} style={style}>
      <label id={`label-${sanitizedGlobalKey}`} className={css.readoutWidget_label}>
        {labelString}
      </label>
      <output aria-labelledby={`label-${sanitizedGlobalKey}`}>
        {sim.globals.get(globalKey)} {data?.unit || ""}
      </output>
    </div>
  );
});

registerWidget({
  component: ReadoutWidget,
  size: "short",
  type: readoutWidgetType
});
