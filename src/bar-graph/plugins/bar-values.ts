import { BarElement, BubbleDataPoint, Chart, ChartTypeRegistry, Plugin, ScatterDataPoint } from 'chart.js';

interface BarValuesOptions {
  callback?: (barValues: BarElement[]) => void;
}

const BarValuesPlugin: Plugin<"bar"> = {
  id: "barValues",

  afterRender: (chart, _args, options: BarValuesOptions) => {
    if (options.callback) {
      options.callback(getBarElements(chart));
    }
  },

  resize: (chart, _args, options: BarValuesOptions) => {
    if (options.callback) {
      options.callback(getBarElements(chart));
    }
  },
};

export const getBarElements = (chart: Chart<keyof ChartTypeRegistry, (number | ScatterDataPoint | BubbleDataPoint | null)[], unknown>) => {
  return chart.getDatasetMeta(0).data as unknown as BarElement[];
};

export default BarValuesPlugin;