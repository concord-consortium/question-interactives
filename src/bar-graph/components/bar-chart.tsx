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
          max,
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
      {hasHorizontalLabel && <div className={css.horizontalLabel}>{authoredState.yAxisLabel}</div>}
      <div className={css.chartContainer}>
        <Bar options={options} data={data} ref={chartRef} />

        {chartInfo && <div className={css.barValues}>
          {authoredState.showValuesAboveBars && chartInfo.bars.map(renderedBar => {
            const { index } = renderedBar;
            const top = renderedBar.top - 30 - (!report && !authoredState.bars[index].lockValue ? (0.75 * SliderIconHalfHeight) : 0);
            const style: React.CSSProperties = {
              ...renderedBar,
              top,
              fontFamily: fontFamily,
              fontSize: 20,
              fontWeight: "bold"
            };
            return <div key={index} style={style} tabIndex={1 + (2 * index)}>{renderedBar.value}</div>;
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
    </div>
  );
};
