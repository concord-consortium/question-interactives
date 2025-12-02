import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps, ReadoutWidgetData } from "../types/widgets";
import { registerWidget } from "./widget-registration";

import css from "./readout-widget.scss";

export const readoutWidgetType = "readout";

const sanitizeGlobalKey = (str: string) => {
  return str.replace(/[^a-zA-Z0-9\-_:.]/g, "_");
};

const clampPrecision = (precision: number | undefined | null, def: number): number => {
  const p = typeof precision === "number" && Number.isFinite(precision)
    ? Math.floor(precision)
    : def;

  if (!Number.isSafeInteger(p) || p < 0) return 0;
  if (p > 5) return 5;
  return p;
};

const formatValue = (value: number, formatType?: string, precision?: number): string => {
  if (typeof value !== "number" || !isFinite(value)) {
    return String(value);
  }

  switch (formatType) {
    case "decimal": {
      const decimalPlaces = clampPrecision(precision, 2);
      return value.toFixed(decimalPlaces);
    }

    case "percent": {
      const decimalPlaces = clampPrecision(precision, 0);
      return (value * 100).toFixed(decimalPlaces);
    }

    case "integer":
    default:
      return Math.round(value).toString();
  }
};

export const ReadoutWidget = observer(function ReadoutWidget({ data, globalKey, sim }: IWidgetComponentProps<ReadoutWidgetData>) {
  const labelString = data?.label ? ` ${data.label}` : "";
  const sanitizedGlobalKey = sanitizeGlobalKey(globalKey);
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  const value = sim.globals.get(globalKey);
  const formatType = data?.formatType ?? "integer";
  const formattedValue = typeof value === "number"
    ? formatValue(value, formatType, data?.precision)
    : String(value);
  const unit = formatType === "percent" ? "%" : (data?.unit ?? "");

  return (
    <div className={css.readoutWidget} style={style}>
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
