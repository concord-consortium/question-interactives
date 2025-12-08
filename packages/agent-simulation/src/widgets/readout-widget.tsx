import React from "react";
import { observer } from "mobx-react-lite";
import classNames from "classnames";

import { registerWidget } from "./widget-registration";
import { IWidgetComponentProps, ReadoutWidgetData } from "../types/widgets";
import { formatValue } from "../utils/format-utils";

import css from "./readout-widget.scss";

export const readoutWidgetType = "readout";

const sanitizeGlobalKey = (str: string) => {
  return str.replace(/[^a-zA-Z0-9\-_:.]/g, "_");
};

export const ReadoutWidget = observer(function ReadoutWidget({ data, globalKey, sim, isCompletedRecording, isRecording, inRecordingMode, recordedGlobalValues }: IWidgetComponentProps<ReadoutWidgetData>) {
  const labelString = data?.label ? ` ${data.label}` : "";
  const sanitizedGlobalKey = sanitizeGlobalKey(globalKey);
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  // Use recorded values when viewing a completed recording, otherwise use current sim values
  const value = isCompletedRecording && recordedGlobalValues?.[globalKey] !== undefined
    ? recordedGlobalValues[globalKey]
    : sim.globals.get(globalKey);
  const formatType = data?.formatType ?? "integer";
  const formattedValue = typeof value === "number"
    ? formatValue(value, formatType, data?.precision)
    : String(value);
  const unit = formatType === "percent" ? "%" : (data?.unit ?? "");

  const containerClasses = classNames(css.readoutWidget, {
    [css.recording]: isRecording,
    [css.completedRecording]: isCompletedRecording,
    [css.inRecordingMode]: inRecordingMode
  });

  return (
    <div className={containerClasses} style={style}>
      <label id={`label-${sanitizedGlobalKey}`} className={css.readoutWidget_label}>
        {labelString}
      </label>
      <output aria-labelledby={`label-${sanitizedGlobalKey}`}>
        {formattedValue} {unit}
      </output>
    </div>
  );
});

registerWidget({
  component: ReadoutWidget,
  size: "short",
  type: readoutWidgetType
});
