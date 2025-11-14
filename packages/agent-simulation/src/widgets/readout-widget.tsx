import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { registerWidget } from "./widget-registration";

export const readoutWidgetType = "readout";

const ReadoutWidget = observer(function ReadoutWidget({ data, globalKey, sim }: IWidgetComponentProps) {
  const labelString = data?.label ? ` ${data.label}` : "";
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  const value = sim.globals.getValue(globalKey);

  return <div style={style}>{`${value}${labelString}`}</div>;
});

registerWidget({
  component: ReadoutWidget,
  type: readoutWidgetType
});
