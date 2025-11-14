import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

export const readoutWidgetType = "readout";

const ReadoutWidget = observer(function ReadoutWidget({ data, globalKey, sim }: IWidgetComponentProps) {
  const labelString = data?.label ? ` ${data.label}` : "";
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  const global = sim.globals.getGlobal(globalKey);

  if (!global) {
    const message = `Define the "${globalKey}" global before using it in a readout widget.`;
    return <WidgetError message={message} />;
  }

  return <div style={style}>{`${global.value}${labelString}`}</div>;
});

registerWidget({
  component: ReadoutWidget,
  type: readoutWidgetType
});
