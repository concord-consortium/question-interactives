import React from "react";
import { AgentSimulation } from "../models/agent-simulation";
import { widgetData } from "../widgets/widget-registration";

interface IWidgetProps {
  sim: AgentSimulation | null;
}
export function Widgets({ sim }: IWidgetProps) {
  if (!sim) return null;

  return (
    <div className="widgets-container">
      {sim.widgets.map((widget, index) => {
        const WidgetComponent = widgetData[widget.type]?.component;

        if (!WidgetComponent) return null;

        return <WidgetComponent key={`${index}-${widget.globalKey}-${widget.type}`} {...widget} sim={sim} />;
      })}
    </div>
  );
}
