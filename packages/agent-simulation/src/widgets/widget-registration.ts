import { WidgetComponent } from "../types/widgets";

export interface WidgetData {
  component: WidgetComponent;
  type: string;
}

export const widgetData: Record<string, WidgetData> = {};

export function registerWidget(widget: WidgetData) {
  widgetData[widget.type] = widget;
}
