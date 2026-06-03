import React from "react";
import classNames from "classnames";
import { IWidgetProps as IWidgetConfig, WidgetSize } from "../types/widgets";
import { Globals } from "../models/globals";
import { widgetData } from "../widgets/widget-registration";
import { computeLayoutForAllWidgets } from "./widget-layout-calculator";

import css from "./widgets.scss";

interface IProps {
  widgets: IWidgetConfig[];
  globals: Globals;
}

const sizeToClass: Record<WidgetSize, string> = {
  "short": css.widgetShort,
  "tall": css.widgetTall,
  "very-tall": css.widgetVeryTall
};

export function Widgets({ widgets, globals }: IProps) {
  const validWidgets = widgets.filter(w => {
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
              globals={globals}
            />
          </div>
        );
      })}
    </div>
  );
}
