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
      {sim.widgets.map(widget => {
        const WidgetComponent = widgetData[widget.type]?.component;

        if (!WidgetComponent) return null;

        return <WidgetComponent key={widget.global} {...widget} sim={sim} />;
      })}
    </div>
  );
}
