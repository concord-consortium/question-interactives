import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";
import ChartInfoPlugin, { IChartInfo, IRenderedBar } from "../plugins/chart-info";
import { Slider, SliderIconHalfHeight } from "./slider";

import css from "./bar-chart.scss";
import classnames from "classnames";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartInfoPlugin
);

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const titleTabIndex = 2;
const yAxisTabIndex = titleTabIndex + 1;
const xAxisTabIndex = yAxisTabIndex + 1;
export const StartChartTabIndex = xAxisTabIndex + 1;

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
  const [chartInfo, setChartInfo] = useState<IChartInfo|undefined>(undefined);
  const chartRef = useRef<ChartJS<"bar">|null>(null);

  const max = authoredState.maxYValue || DefaultAuthoredState.maxYValue;

  const normalizeValue = useCallback((value: number) => parseFloat(value.toFixed(authoredState.numberOfDecimalPlaces || 0)), [authoredState]);

  useEffect(() => {
    setOptions({
      animation: false,
      responsive: true,
      scales: {
        x: {
          title: {
            display: false,
          },
          ticks: {
            font: font(20),
            color
          }
        },
        y: {
          type: "linear",
          title: {
            display: false,
          },
          ticks: {
            stepSize: authoredState.yAxisCountBy
          },
          beginAtZero: true,
          max,
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false
        },
        tooltip: {
          enabled: false
        },
        chartInfo: {
          callback: setChartInfo
        }
      } as any // to allow custom plugin options for barValue
    });
    setData({
      labels: authoredState.bars.map(bar => bar.label),
      datasets: [
        {
          data: authoredState.bars.map(bar => normalizeValue(bar.value || 0)),
          backgroundColor: authoredState.bars.map(bar => bar.color || defaultBarColor)
        }
      ],
    });
  }, [authoredState, max, normalizeValue]);

  const handleSliderChange = (renderedBar: IRenderedBar, newValue: number, changeOptions?: {delta: boolean}) => {
    setData(prev => {
      if (prev) {
        const {index} = renderedBar;
        const oldValue = normalizeValue(prev.datasets[0].data[index]);
        const setValue = changeOptions?.delta ? Math.max(0, Math.min(max, oldValue + newValue)) : newValue;
        prev.datasets[0].data[index] = normalizeValue(setValue);
        setTimeout(() => chartRef.current?.update("none"), 0); // "none" to disable animations
      }
      return prev;
    });
  };

  if (!options || !data) {
    return null;
  }

  const hasHorizontalLabel = !!authoredState.yAxisLabel && authoredState.yAxisOrientation === "horizontal";
  return (
    <div className={css.barChart}>
      <div className={css.chart}>
        <div className={classnames(css.yAxisLabel, {[css.horizontalLabel]: hasHorizontalLabel, [css.verticalLabel]: !hasHorizontalLabel})} tabIndex={yAxisTabIndex}>{authoredState.yAxisLabel}</div>
        <div className={css.chartAndXAxisLabel}>
          {authoredState.title && <div className={css.title} tabIndex={titleTabIndex}>{authoredState.title}</div>}
          <div className={css.chartContainer}>
            <Bar options={options} data={data} ref={chartRef} />

            {chartInfo && <div className={css.barValues}>
              {authoredState.showValuesAboveBars && chartInfo.bars.map(renderedBar => {
                const { index } = renderedBar;
                const bar = authoredState.bars[index];
                const top = renderedBar.top - 30 - (!report && !authoredState.bars[index].lockValue ? (0.75 * SliderIconHalfHeight) : 0);
                const style: React.CSSProperties = {
                  ...renderedBar,
                  top,
                  fontFamily: fontFamily,
                  fontSize: 20,
                  fontWeight: "bold"
                };
                const value = authoredState.numberOfDecimalPlaces ? renderedBar.value.toFixed(authoredState.numberOfDecimalPlaces) : renderedBar.value;
                const title = `${bar.label}: ${value} ${authoredState.yAxisLabel}`;
                return <div key={index} style={style} tabIndex={StartChartTabIndex + (2 * index)} title={title}>{value}</div>;
              })}
              {!report && chartInfo.bars.map(renderedBar => {
                const { index } = renderedBar;
                if (authoredState.bars[index].lockValue) {
                  return null;
                }
                return (
                  <Slider
                    key={index}
                    renderedBar={renderedBar}
                    top={chartInfo.top}
                    bottom={chartInfo.bottom}
                    max={max}
                    handleSliderChange={handleSliderChange}
                  />
                );
              })}
            </div>}
          </div>
          {authoredState.xAxisLabel && <div className={css.xAxisLabel} tabIndex={xAxisTabIndex}>{authoredState.xAxisLabel}</div>}
        </div>
      </div>
    </div>
  );
};
