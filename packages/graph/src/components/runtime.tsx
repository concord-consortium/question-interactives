import React, { useEffect, useMemo, useRef, useState } from "react";
import { IAuthoredState } from "./types";
import {
  addLinkedInteractiveStateListener, IInteractiveStateWithDataset, removeLinkedInteractiveStateListener, IDataset
} from "@concord-consortium/lara-interactive-api";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart, ChartOptions, Legend, LinearScale, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { TypedDataTableMetadata, TypedObject, useObjectStorage } from "@concord-consortium/object-storage";

import { generateChartData, emptyChartData, CustomChartData } from "../generate-chart-data";

import css from "./runtime.scss";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface IProps {
  authoredState: IAuthoredState;
}

const getGraphOptions = (authoredState: IAuthoredState, chartData?: CustomChartData): ChartOptions<"bar"> => {
  let yAxisLabel;
  if (authoredState.useYAxisLabelFromData && chartData && chartData.datasets.length > 0) {
    yAxisLabel = chartData.datasets[0].label;
  } else if (!authoredState.useYAxisLabelFromData && authoredState.yAxisLabel) {
    yAxisLabel = authoredState.yAxisLabel;
  }

  const yAxisOptions: any = {};
  if (authoredState.autoscaleYAxis === false) {
    const maxY = typeof authoredState.yAxisMax === "number" ? authoredState.yAxisMax : 100;
    yAxisOptions.max = maxY;
  }
  const displayLegend = chartData ? authoredState.displayLegend : false;

  return {
    plugins: {
      legend: {
        display: displayLegend, // top legend with datasets and their colors
        align: "start",
        fullSize: false // this will put each legend in its own line (name of the property doesn't suggest that)
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        type: "linear",
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
        },
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 5,
        },
        ...yAxisOptions
      },
      x: {
        // The bar chart does not display at all if you specify the type here for the x axis.
        // This was specified before we upgraded chart.js versions.  Leaving here commented out
        // for posterity.
        // type: "linear",
        title: {
          display: !!authoredState.xAxisLabel,
          text: authoredState.xAxisLabel || "",
        },
        ticks: {
          display: authoredState.displayXAxisLabels // this will show/hide labels only
        }
      }
    }
  };
};

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const [ datasets, setDatasets ] = useState<Array<IDataset | null | undefined>>([]);
  const dataSourceInteractive1 = useLinkedInteractiveId("dataSourceInteractive1");
  const dataSourceInteractive2 = useLinkedInteractiveId("dataSourceInteractive2");
  const dataSourceInteractive3 = useLinkedInteractiveId("dataSourceInteractive3");
  const hasObjectStorageData = useRef(false);

  const linkedInteractives = useMemo(() => {
    return [ dataSourceInteractive1,
      dataSourceInteractive2,
      dataSourceInteractive3
    ].filter(intItemId => intItemId !== undefined) as string[];
  }, [dataSourceInteractive1, dataSourceInteractive2, dataSourceInteractive3]);

  useEffect(() => {
    const unsubscribeMethods = linkedInteractives.map((dataSourceInteractive, datasetIdx) => {
      const listener = (newLinkedIntState: IInteractiveStateWithDataset | undefined) => {
        const newDataset = newLinkedIntState && newLinkedIntState.dataset;
        const isValidDatasetVersion = newDataset && newDataset.type === "dataset" && Number(newDataset.version) === 1;

        if (hasObjectStorageData.current) {
          // if we are already using object storage data, ignore dataset updates from interactive state
          return;
        }

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
  }, [linkedInteractives]);

  const objectStorage = useObjectStorage();

  useEffect(() => {
    const unsubscribes = linkedInteractives.map((linkedInteractiveId, datasetIdx) => {
      const unsubscribe = objectStorage.monitor(linkedInteractiveId, (objects) => {
        // find the latest dataTable (objects are ordered from oldest to newest)
        objects.reverse();
        const latestTypedObject = objects.find(obj => TypedObject.IsSupportedTypedObjectMetadata(obj.metadata));
        if (latestTypedObject && TypedObject.IsSupportedTypedObjectMetadata(latestTypedObject.metadata)) {
          const dataTableEntry = Object.entries(latestTypedObject.metadata.items).find(([key, item]) => item.type === "dataTable") as [string, TypedDataTableMetadata] | undefined;
          const [dataTableId, dataTableMetadata] = dataTableEntry || [];
          if (dataTableId && dataTableMetadata) {
            const loadDataTableObject = async () => {
              const objectData = await objectStorage.readData(latestTypedObject.id);
              const dataTableData = objectData?.[dataTableId];
              if (dataTableData) {
                // convert the dataTableObject to the IDataset format
                const newDataset: IDataset = {
                  type: "dataset",
                  version: 1,
                  properties: dataTableMetadata.cols,
                  rows: Object.values(dataTableData.rows || {}).map((row: any) => row)
                };
                setDatasets(prevDatasets => {
                  const newDatasets = prevDatasets.slice();
                  newDatasets[datasetIdx] = newDataset;
                  return newDatasets;
                });
                hasObjectStorageData.current = true;
              }
            };
            loadDataTableObject();
          }
        }
      });
      return unsubscribe;
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [objectStorage, linkedInteractives]);


  const anyData = datasets.filter(d => d !== null).length > 0;
  const graphContainerClassName = css.graph + " " + css["graphLayout" + (authoredState.graphsPerRow || 1)];
  const datasetNames = [
    authoredState.dataSourceInteractive1Name,
    authoredState.dataSourceInteractive2Name,
    authoredState.dataSourceInteractive3Name
  ];
  return (
    <div>
      {
        anyData ?
          generateChartData(datasets, datasetNames, authoredState).map((chartData, idx: number) =>
            <div key={idx} className={graphContainerClassName}>
              <Bar data={chartData} options={getGraphOptions(authoredState, chartData)}
                plugins={[ChartDataLabels]}
              />
            </div>
          ) :
          // Without passing chartData, we won't add things like the legend
          <Bar data={emptyChartData} options={getGraphOptions(authoredState)} />
      }
    </div>
  );
};
