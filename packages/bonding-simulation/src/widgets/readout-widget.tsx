import React from "react";
import { observer } from "mobx-react-lite";

import { registerWidget } from "./widget-registration";
import { IWidgetComponentProps, ReadoutWidgetData } from "../types/widgets";
import { formatValue } from "../utils/format-utils";

import css from "./readout-widget.scss";

export const readoutWidgetType = "readout";

const sanitizeGlobalKey = (str: string) => {
  return str.replace(/[^a-zA-Z0-9\-_:.]/g, "_");
};

export const ReadoutWidget = observer(function ReadoutWidget({ data, globalKey, globals }: IWidgetComponentProps<ReadoutWidgetData>) {
  const labelString = data?.label ? ` ${data.label}` : "";
  const sanitizedGlobalKey = sanitizeGlobalKey(globalKey);
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  const value = globals.get(globalKey);
  const formatType = data?.formatType ?? "integer";
  const formattedValue = typeof value === "number"
    ? formatValue(value, formatType, data?.precision)
    : String(value);
  const unit = formatType === "percent" ? "%" : (data?.unit ?? "");

  return (
    <div className={css.readoutWidget}>
      <span
        className={css.readoutValue}
        data-testid={`readout-${sanitizedGlobalKey}`}
        style={style}
      >
        {formattedValue}{unit}
      </span>
      <span className={css.readoutLabel}>{labelString}</span>
    </div>
  );
});

registerWidget({
  component: ReadoutWidget,
  size: "short",
  type: readoutWidgetType,
});
