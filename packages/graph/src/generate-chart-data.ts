import { ChartData, ChartDataset } from "chart.js";
import { IDataset } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState } from "./components/types";

// Make Chart.js types a bit more specific (remove ? from properties definitions), so it's easier to work with them.
type Label = number | string;
type DataPoint = number; // | null;

type CustomChartDataSet = ChartDataset<"bar"> & ChartDataset<"line"> & {
  data: DataPoint[];
}

export interface CustomChartData extends ChartData<"bar">, ChartData<"line"> {
  labels: Label[];
  datasets: Array<CustomChartDataSet>
}

const bgColors = [
  'rgba(230, 25, 75, 0.2)',   // Vivid Red
  'rgba(0, 130, 200, 0.2)',   // Deep Blue
  'rgba(245, 130, 48, 0.2)',  // Orange
  'rgba(60, 180, 75, 0.2)',   // Green
  'rgba(145, 30, 180, 0.2)',  // Purple
  'rgba(0, 128, 128, 0.2)',   // Teal
];

const borderColors = [
  'rgba(230, 25, 75, 1)',     // Vivid Red
  'rgba(0, 130, 200, 1)',     // Deep Blue
  'rgba(245, 130, 48, 1)',    // Orange
  'rgba(60, 180, 75, 1)',     // Green
  'rgba(145, 30, 180, 1)',    // Purple
  'rgba(0, 128, 128, 1)',     // Teal
];

const getBgColor = (idx: number) => bgColors[idx % bgColors.length];
const getBorderColor = (idx: number) => borderColors[idx % borderColors.length];

const borderWidth = 1;

export const emptyChartData = {
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: getBgColor(0),
    borderColor: getBorderColor(0),
    borderWidth: 1
  }]
};

// It accepts array of IDataset and returns array of Chart.JS ChartData objects.
export const generateChartData = (datasets: Array<IDataset | null | undefined>, datasetNames: Array<string | undefined>,
    authoredState: IAuthoredState) => {
  const result: CustomChartData[] = [];
  const chartDataForProp: {[key: string]: CustomChartData} = {};
  const multipleDatasets = datasets.length > 1;

  datasets.forEach((dataset, datasetIdx) => {
    if (!dataset) {
      return;
    }
    const xPropIdx = dataset.xAxisProp ? dataset.properties.indexOf(dataset.xAxisProp) : -1;
    const labels: Label[] = dataset.rows.map((row, rowIdx) => {
      if (xPropIdx === -1) {
        // If x property isn't defined, use row index, but starting from 1.
        return rowIdx + 1;
      }
      const val = row[xPropIdx] || 0;
      return val !== null ? val : "";
    });

    dataset.properties.forEach((prop, propIdx) => {
      if (propIdx === xPropIdx) {
        return;
      }
      const data = dataset.rows.map(row => row[propIdx]).map(v => typeof v !== "number" ? 0 : v);

      if (!chartDataForProp[prop]) {
        // Generate a new chart data with one chart dataset.
        const colorIdx = multipleDatasets ? datasetIdx : propIdx;
        chartDataForProp[prop] = {
          labels,
          datasets: [{
            label: prop,
            // Ignore non-numeric values for now.
            data,
            backgroundColor: getBgColor(colorIdx),
            borderColor: getBorderColor(colorIdx),
            borderWidth,
            datalabels: {
              align: 'end',
              anchor: 'end',
              display: !!authoredState.displayBarValues
            }
          }]
        };
        result.push(chartDataForProp[prop]);
      } else {
        // Merge labels and data into existing chartData. It'll extend labels list if necessary
        // and add a new dataset into chartData.dataset array.
        mergeIntoChartData({
          data,
          labels,
          datasetIdx,
          targetChartData: chartDataForProp[prop]
        });
      }
    });
  });
  result.forEach(chartData => {
    if (chartData.datasets.length > 1) {
      chartData.datasets.forEach((dataset, idx) => {
        const name = datasetNames[idx] ? ` - ${datasetNames[idx]}` : ` #${idx + 1}`;
        dataset.label += name;
      });
    }
  });
  return result;
};

interface IMergeOptions {
  data: DataPoint[],
  labels: Label[],
  datasetIdx: number,
  targetChartData: CustomChartData
}

const mergeIntoChartData = ({ data, labels, datasetIdx, targetChartData }: IMergeOptions) => {
  const newData: DataPoint[] = [];
  const mergedIdx: Record<number, boolean> = {};

  // First, process existing labels, try to find them in new dataset and use corresponding values.
  targetChartData.labels.forEach((label: string | number, existingDataIdx: number) => {
    const newDataIdx = labels.indexOf(label);
    if (newDataIdx !== -1) {
      newData[existingDataIdx] = data[newDataIdx];
      mergedIdx[newDataIdx] = true;
    } else {
      newData[existingDataIdx] = 0;
    }
  });
  // Then, add new labels from the new dataset.
  labels.forEach((newLabel: string | number, newDataIdx: number) => {
    if (!mergedIdx[newDataIdx]) {
      targetChartData.labels.push(newLabel);
      newData.push(data[newDataIdx]);
    }
  });
  targetChartData.datasets.push({
    label: `${targetChartData.datasets[0].label}`,
    data: newData,
    backgroundColor: getBgColor(datasetIdx),
    borderColor: getBorderColor(datasetIdx),
    borderWidth
  });
};
