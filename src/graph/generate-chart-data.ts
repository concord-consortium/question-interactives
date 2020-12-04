import { ChartData, ChartDataSets } from "chart.js";
import { IDataset } from "@concord-consortium/lara-interactive-api";

// Make Chart.js types a bit more specific (remove ? from properties definitions), so it's easier to work with them.
type Label = number | string;
type DataPoint = number | null;

interface CustomChartDataSet extends ChartDataSets {
  data: DataPoint[];
}

interface CustomChartData extends ChartData {
  labels: Label[];
  datasets: Array<CustomChartDataSet>
}

const bgColors =  [
  'rgba(255, 99, 132, 0.2)',
  'rgba(54, 162, 235, 0.2)',
  'rgba(255, 206, 86, 0.2)',
  'rgba(75, 192, 192, 0.2)',
  'rgba(153, 102, 255, 0.2)',
  'rgba(255, 159, 64, 0.2)',
];

const borderColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
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
export const generateChartData = (datasets: Array<IDataset | null | undefined>) => {
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
      const val = row[xPropIdx];
      return val !== null ? val : "";
    });

    dataset.properties.forEach((prop, propIdx) => {
      if (propIdx === xPropIdx) {
        return;
      }
      const data = dataset.rows.map(row => row[propIdx]).map(v => typeof v !== "number" ? null : v);
      const colorIdx = multipleDatasets ? datasetIdx : propIdx;

      if (!chartDataForProp[prop]) {
        // Generate a new chart data with one chart dataset.
        chartDataForProp[prop] = {
          labels,
          datasets: [{
            label: prop,
            // Ignore non-numeric values for now.
            data,
            backgroundColor: getBgColor(colorIdx),
            borderColor: getBorderColor(colorIdx),
            borderWidth
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
      newData[existingDataIdx] = null;
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
    label: `${targetChartData.datasets[0].label} #${datasetIdx + 1}`,
    data: newData,
    backgroundColor: getBgColor(datasetIdx),
    borderColor: getBorderColor(datasetIdx),
    borderWidth
  });
};
