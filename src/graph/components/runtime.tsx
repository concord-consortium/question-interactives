import React, { useEffect, useState } from "react";
import { IAuthoredState } from "./types";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener, IDataset
} from "@concord-consortium/lara-interactive-api";
import { Bar } from "react-chartjs-2";
import { generateChartData, emptyChartData } from "../generate-chart-data";

export interface IProps {
  authoredState: IAuthoredState;
}

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
        // Accept null or undefined datasets too to clear them. If it's an object, make sure it follows
        // specified format.
        if (!newDataset || newDataset && newDataset.type === "dataset" && Number(newDataset.version) === 1) {
          setDatasets(prevDatasets => {
            const newDatasets = prevDatasets.slice();
            newDatasets[datasetIdx] = newDataset;
            return newDatasets;
          });
        } else if (newDataset && newDataset.type === "dataset" && Number(newDataset.version) !== 1) {
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
  return (
    <div>
      {
        anyData ?
          generateChartData(datasets).map((chartData, idx: number) =>
            <Bar key={idx} data={chartData} options={defaultGraphOptions} />
          ) :
          <Bar data={emptyChartData} options={emptyGraphOptions} />
      }
    </div>
  );
};
