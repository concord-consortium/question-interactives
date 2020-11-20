import React, { useEffect, useState } from "react";
import { IAuthoredState } from "./types";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener, IDataset
} from "@concord-consortium/lara-interactive-api";
import { Bar } from "react-chartjs-2";
import { ChartOptions } from "chart.js";
import { generateChartData, emptyChartData } from "../generate-chart-data";
import css from "./runtime.scss";

export interface IProps {
  authoredState: IAuthoredState;
}

const defaultGraphOptions: ChartOptions = {
  maintainAspectRatio: false,
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

const emptyGraphOptions = {
  ...defaultGraphOptions,
  legend: {
    display: false
  }
};

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const [ datasets, setDatasets ] = useState<Array<IDataset | null | undefined>>([]);

  useEffect(() => {
    const linkedInteractives: string[] = [
      authoredState.dataSourceInteractive1,
      authoredState.dataSourceInteractive2,
      authoredState.dataSourceInteractive3
    ].filter(intItemId => intItemId !== undefined) as string[];

    const unsubscribeMethods = linkedInteractives.map((dataSourceInteractive, datasetIdx) => {
      const listener = (newLinkedIntState: IInteractiveStateWithDataset | undefined) => {
        const newDataset = newLinkedIntState && newLinkedIntState.dataset;
        const isValidDatasetVersion = newDataset && newDataset.type === "dataset" && Number(newDataset.version) === 1;

        // Accept null or undefined datasets too to clear them. If it's an object, make sure it follows specified format.
        if (!newDataset || isValidDatasetVersion) {
          setDatasets(prevDatasets => {
            const newDatasets = prevDatasets.slice();
            newDatasets[datasetIdx] = newDataset;
            return newDatasets;
          });
        } else if (newDataset && !isValidDatasetVersion) {
          console.warn(`Dataset version ${newDataset.version} is not supported`);
          setDatasets(prevDatasets => {
            const newDatasets = prevDatasets.slice();
            newDatasets[datasetIdx] = null;
            return newDatasets;
          });
        }
      };
      const options = { interactiveItemId: dataSourceInteractive };
      addLinkedInteractiveStateListener<any>(listener, options);
      return () => {
        removeLinkedInteractiveStateListener<any>(listener);
      };
    });
    return () => {
      unsubscribeMethods.forEach(unsubscribeMethod => unsubscribeMethod());
    };
  }, [authoredState.dataSourceInteractive1, authoredState.dataSourceInteractive2, authoredState.dataSourceInteractive3]);

  const anyData = datasets.filter(d => d !== null).length > 0;
  const graphContainerClassName = css.graph + " " + css["graphLayout" + (authoredState.graphsPerRow || 1)];
  return (
    <div>
      {
        anyData ?
          generateChartData(datasets).map((chartData, idx: number) =>
            <div key={idx} className={graphContainerClassName}>
              <Bar data={chartData} options={defaultGraphOptions} />
            </div>
          ) :
          <Bar data={emptyChartData} options={emptyGraphOptions} />
      }
    </div>
  );
};
