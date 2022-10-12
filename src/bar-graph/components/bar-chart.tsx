import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./bar-chart.scss";
import BarValuesPlugin from "../plugins/bar-values";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarValuesPlugin
);

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

interface IRenderedBar {
  index: number;
  value: number;
  width: number;
  top: number;
  left: number;
  color: string;
}

const defaultBarColor = "#0592AF";
const fontFamily = "'Lato', sans-serif";

const font = (size: number, options?: {bold?: boolean}) => {
  return {
    size,
    family: fontFamily,
    weight: options?.bold ? "bold" : undefined
  };
};

const color = "#3f3f3f";

export const BarChartComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const [options, setOptions] = useState<ChartOptions<"bar">|null>(null);
  const [data, setData] = useState<ChartData<"bar">|null>(null);
  const [renderedBars, setRenderedBars] = useState<IRenderedBar[]>([]);

  // pulls layout info from the bar elements in Chart.js
  const handleUpdateRenderedBars = (barElements: BarElement[]) => {
    const newValues: IRenderedBar[] = [];
    barElements.forEach((barElement: any) => { // note: the any is due some of the values on the object being internal or not types
      const newValue: IRenderedBar = {
        index: barElement.$context.dataIndex,
        value: barElement.$context.raw,
        width: barElement.width,
        top: barElement.base - barElement.height,
        left: barElement.x - (barElement.width / 2),
        color: barElement.options.backgroundColor
      };
      // this may have been called before the drawing is complete (like the initial resize event)
      // so check to make sure we have valid values
      if (!isNaN(newValue.width) || !isNaN(newValue.top) || !isNaN(newValue.left)) {
        newValues.push(newValue);
      }
    });
    setRenderedBars(newValues);
  };

  useEffect(() => {
    setOptions({
      responsive: true,
      scales: {
        x: {
          title: {
            display: !!authoredState.xAxisLabel,
            text: authoredState.xAxisLabel,
            font: font(20, {bold: true}),
            color
          },
          ticks: {
            font: font(20),
            color
          }
        },
        y: {
          type: "linear",
          title: {
            display: !!authoredState.yAxisLabel && authoredState.yAxisOrientation === "vertical",
            text: authoredState.yAxisLabel,
            font: font(20, {bold: true}),
            color
          },
          ticks: {
            stepSize: authoredState.yAxisCountBy
          },
          beginAtZero: true,
          max: authoredState.maxYValue,
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: authoredState.title,
          font: font(24, {bold: true}),
          color
        },
        tooltip: {
          enabled: false
        },
        barValues: {
          callback: handleUpdateRenderedBars
        }
      } as any // to allow custom plugin options for barValue
    });
    setData({
      labels: authoredState.bars.map(bar => bar.label),
      datasets: [
        {
          data: authoredState.bars.map(bar => bar.value || 0),
          backgroundColor: authoredState.bars.map(bar => bar.color || defaultBarColor)
        }
      ],
    });
  }, [authoredState]);

  if (!options || !data) {
    return null;
  }

  if (!!authoredState.yAxisLabel && authoredState.yAxisOrientation === "horizontal") {
    return (
      <div className={css.barChart}>
        <div className={css.horizontalLabel}>{authoredState.yAxisLabel}</div>
        <div className={css.chartContainer}>
          <Bar options={options} data={data} />
          {authoredState.showValuesAboveBars && <div className={css.barValues}>
            {renderedBars.map(renderedBar => {
              const style: React.CSSProperties = {
                ...renderedBar,
                top: renderedBar.top - 30,
                fontFamily: fontFamily,
                fontSize: 20,
                fontWeight: "bold"
              };
              return <div key={renderedBar.index} style={style}>{renderedBar.value}</div>;
            })}
          </div>}
        </div>
      </div>
    );
  }

  return (
    <Bar options={options} data={data} />
  );
};
