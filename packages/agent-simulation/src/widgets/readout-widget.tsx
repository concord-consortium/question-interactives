import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { registerWidget } from "./widget-registration";
import { useInitializeGlobal } from "./use-initialize-global";

export const readoutWidgetType = "readout";

const ReadoutWidget = observer(function ReadoutWidget({ data, defaultValue, globalKey, sim }: IWidgetComponentProps) {
  useInitializeGlobal({ defaultValue, globalKey, sim });

  const labelString = data?.label ? ` ${data.label}` : "";
  const style = {
    backgroundColor: data?.backgroundColor,
    color: data?.color
  };

  return <div style={style}>{`${sim.globals.get(globalKey)}${labelString}`}</div>;
});

registerWidget({
  component: ReadoutWidget,
  type: readoutWidgetType
});
