import { BarElement, BubbleDataPoint, Chart, ChartTypeRegistry, Plugin, ScatterDataPoint } from 'chart.js';

export interface IRenderedBar {
  index: number;
  value: number;
  width: number;
  top: number;
  left: number;
  center: number;
  color: string;
}

export interface IChartInfo {
  top: number;
  bottom: number;
  bars: IRenderedBar[]
}

interface IChartInfoPluginOptions {
  callback?: (chartInfo: IChartInfo) => void;
}

const ChartInfoPlugin: Plugin<"bar"> = {
  id: "chartInfo",

  afterRender: (chart, _args, options: IChartInfoPluginOptions) => {
    if (options.callback) {
      options.callback(getChartInfo(chart));
    }
  },

  resize: (chart, _args, options: IChartInfoPluginOptions) => {
    if (options.callback) {
      options.callback(getChartInfo(chart));
    }
  },
};

export const getChartInfo = (chart: Chart<keyof ChartTypeRegistry, (number | ScatterDataPoint | BubbleDataPoint | null)[], unknown>): IChartInfo => {
  const {bottom, top} = chart.scales?.y ?? {height: 0, bottom: 0};
  const bars: IRenderedBar[]  = [];

  const barElements = chart.getDatasetMeta(0).data as unknown as BarElement[];
  barElements.forEach((barElement: any, index) => { // note: the any is due some of the values on the object being internal or not types
    const newValue: IRenderedBar = {
      index,
      value: barElement.$context.raw,
      width: barElement.width,
      top: barElement.base - barElement.height,
      left: barElement.x - (barElement.width / 2),
      center: barElement.x,
      color: barElement.options.backgroundColor
    };
    // this may have been called before the drawing is complete (like the initial resize event)
    // so check to make sure we have valid values
    if (!isNaN(newValue.width) && !isNaN(newValue.top) && !isNaN(newValue.left)) {
      bars.push(newValue);
    }
  });

  return { bottom, top, bars };
};

export default ChartInfoPlugin;
