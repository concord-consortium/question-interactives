import { BaseSliderWidgetData } from "../types/widgets";

export function validateSliderWidgetData(data: BaseSliderWidgetData, value: number, widgetType: string): string | null {
  if (!Number.isFinite(data.min) || !Number.isFinite(data.max)) {
    return `${widgetType} requires numeric min and max values in its data configuration.`;
  }
  if (data.min >= data.max) {
    return `${widgetType} requires min value to be less than max value.`;
  }
  if (!data.label) {
    return `${widgetType} requires a label in its data configuration.`;
  }
  if (data.step !== undefined && (!Number.isFinite(data.step) || data.step <= 0)) {
    return `${widgetType} step must be a positive number.`;
  }
  if (!Number.isFinite(value)) {
    return `${widgetType} requires a global with a numeric value.`;
  }

  return null;
}
