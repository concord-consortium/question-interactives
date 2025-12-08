import React from "react";
import classNames from "classnames";
import { AgentSimulation } from "../models/agent-simulation";
import { WidgetSize } from "../types/widgets";
import { widgetData } from "../widgets/widget-registration";
import { computeLayoutForAllWidgets } from "./widget-layout-calculator";

import css from "./widgets.scss";

interface IWidgetProps {
  sim: AgentSimulation | null;
  isCompletedRecording: boolean;
  isRecording: boolean;
  inRecordingMode: boolean;
}

const sizeToClass: Record<WidgetSize, string> = {
  "short": css.widgetShort,
  "tall": css.widgetTall,
  "very-tall": css.widgetVeryTall
};

export function Widgets({ sim, isCompletedRecording, isRecording, inRecordingMode }: IWidgetProps) {
  if (!sim) return null;

  const validWidgets = sim.widgets.filter(w => {
    const reg = widgetData[w.type];
    if (!reg) {
      console.warn(`No widget registration found for type: '${w.type}'`);
      return false;
    }
    if (!reg.size) {
      console.warn(`Widget registration for type '${w.type}' is missing a 'size' property.`);
      return false;
    }

    return true;
  });

  const widgetSizes = validWidgets.map(w => widgetData[w.type].size);
  const layout = computeLayoutForAllWidgets(widgetSizes);

  return (
    <div className={css.widgetsContainer}>
      {validWidgets.map((widget, index) => {
        const widgetRegistration = widgetData[widget.type];
        if (!widgetRegistration) return null;

        const { component: WidgetComponent, size } = widgetRegistration;
        const sizeClass = sizeToClass[size];
        const layoutInfo = layout[index];

        const widgetClassNames = classNames(
          css.widget,
          sizeClass,
          {
            [css.widgetFullWidth]: layoutInfo?.spansFullWidth ?? false,
            [css.widgetMatchTallHeight]: layoutInfo?.spanToMatchTall ?? false,
          }
        );

        return (
          <div
            key={`${index}-${widget.globalKey}-${widget.type}`}
            className={widgetClassNames}
          >
            <WidgetComponent
              {...widget}
              sim={sim}
              isCompletedRecording={isCompletedRecording}
              isRecording={isRecording}
              inRecordingMode={inRecordingMode}
            />
          </div>
        );
      })}
    </div>
  );
}
