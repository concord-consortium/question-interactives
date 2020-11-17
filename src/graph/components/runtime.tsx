import React, { useEffect, useState } from "react";
import { IAuthoredState } from "./types";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener, IDataset
} from "@concord-consortium/lara-interactive-api";
import { Bar } from "react-chartjs-2";
import { ChartData } from "chart.js";

export interface IProps {
  authoredState: IAuthoredState;
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

const defaultGraphOptions = {
  scales: {
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
        },
      },
    ],
  },
};

const getChartData = (dataset: IDataset) => {
  const xPropIdx = dataset.properties.indexOf(dataset.xAxisProp);
  if (xPropIdx < 0) {
    throw new Error("Incorrect dataset.xAxisProp value");
  }
  const labels = dataset.rows.map(row => row[xPropIdx] || "");
  const result: ChartData[] = [];
  dataset.properties.forEach((prop, idx) => {
    if (idx === xPropIdx) {
      return;
    }
    const chartData: ChartData = {
      labels,
      datasets: [{
        label: prop,
        // Ignore non-numeric values for now.
        data: dataset.rows.map(row => row[idx]).map(v => typeof v !== "number" ? null : v),
        backgroundColor: getBgColor(idx),
        borderColor: getBorderColor(idx),
        borderWidth: 1
      }]
    };
    result.push(chartData);
  });
  return result;
};

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const [ dataset, setDataset ] = useState<IDataset | null | undefined>();

  useEffect(() => {
    if (authoredState.dataSourceInteractive) {
      const listener = (newLinkedIntState: IInteractiveStateWithDataset | undefined) => {
        const newDataset = newLinkedIntState && newLinkedIntState.dataset;
        // Accept null or undefined datasets too to clear them. If it's an object, make sure it follows
        // specified format.
        if (!newDataset || newDataset && newDataset.type === "dataset" && newDataset.version === 1) {
          setDataset(newDataset);
        } else if (newDataset && newDataset.type === "dataset" && newDataset.version !== 1) {
          console.warn(`Dataset version ${newDataset.version} is not supported`);
          setDataset(null);
        }
      };
      const options = { interactiveItemId: authoredState.dataSourceInteractive };
      addLinkedInteractiveStateListener<any>(listener, options);
      return () => {
        removeLinkedInteractiveStateListener<any>(listener);
      };
    }
  }, [ authoredState.dataSourceInteractive ]);

  return (
    <div>
      {
        dataset ?
          getChartData(dataset).map((chartData, idx) =>
            <Bar key={idx} data={chartData} options={defaultGraphOptions} />
          ) :
          <p>Waiting for data from {authoredState.dataSourceInteractive} interactive.</p>
      }
    </div>
  );
};
