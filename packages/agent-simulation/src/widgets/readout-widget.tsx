import React from "react";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps } from "../types/widgets";
import { registerWidget } from "./widget-registration";

export const readoutWidgetType = "readout";

const ReadoutWidget = observer(function ReadoutWidget({ global, sim }: IWidgetComponentProps) {
  return <div>{sim.globals[global].value}</div>;
});

registerWidget({
  component: ReadoutWidget,
  type: readoutWidgetType
});
