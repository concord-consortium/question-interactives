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
import classnames from "classnames";
import { log as logToLara } from "@concord-consortium/lara-interactive-api";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { DefaultAuthoredState, IAuthoredState, IBarValue, IInteractiveState } from "./types";
import ChartInfoPlugin, { IChartInfo, IRenderedBar } from "../plugins/chart-info";
import { Slider, SliderChangeCallback, SliderChangeCallbackOptions, SliderIconHalfHeight } from "./slider";
import { useContextInitMessage } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";

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

const titleTabIndex = 2;
const yAxisTabIndex = titleTabIndex + 1;
const xAxisTabIndex = yAxisTabIndex + 1;
export const StartChartTabIndex = xAxisTabIndex + 1;

export const DefaultBarColor = "#0592AF";
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
  const [loggedInit, setLoggedInit] = useState(false);
  const chartRef = useRef<ChartJS<"bar">|null>(null);
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const max = authoredState.maxYValue || DefaultAuthoredState.maxYValue;

  const normalizeValue = useCallback((value: number) => parseFloat(value.toFixed(authoredState.numberOfDecimalPlaces || 0)), [authoredState]);

  const initMessage = useContextInitMessage();
  const log = useCallback((action: string, logData?: object | undefined) => {
    if (initMessage?.mode === "runtime") {
      logToLara(action, logData);
    }
  }, [initMessage]);

  useEffect(() => {
    if (authoredState && !loggedInit) {
      log("init bar chart", {barChart: authoredState});
      setLoggedInit(true);
    }
  }, [log, authoredState, loggedInit]);

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

    const barValues = interactiveState?.barValues ?? [];
    const newData = authoredState.bars.map((bar, index) => {
      const savedValue = barValues?.find(b => b.index === index);
      return normalizeValue((savedValue?.hasValue ? savedValue.value : bar.value) || 0);
    });

    setData({
      labels: authoredState.bars.map(bar => bar.label),
      datasets: [
        {
          data: newData,
          backgroundColor: authoredState.bars.map(bar => bar.color || DefaultBarColor)
        }
      ],
    });
  }, [authoredState, interactiveState, max, normalizeValue]);

  const handleSliderChange: SliderChangeCallback = useCallback((renderedBar: IRenderedBar, newValue: number, {via, key, delta, skipLog}: SliderChangeCallbackOptions) => {
    setData(prevData => {
      if (prevData) {
        const {index} = renderedBar;
        const bar = authoredState.bars[index];
        const oldValue = normalizeValue(prevData.datasets[0].data[index]);
        const setValue = normalizeValue(delta ? Math.max(0, Math.min(max, oldValue + newValue)) : newValue);
        prevData.datasets[0].data[index] = setValue;
        if (!skipLog) {
          const change: any = {bar: bar.label, value: setValue, via};
          if (key) {
            change.key = key;
          }
          log("bar change", change);
        }
        setTimeout(() => {
          setInteractiveState?.((prevInteractiveState: IInteractiveState) => {
            const newBarValue: IBarValue = { index, hasValue: true, value: setValue};
            let barValues: IBarValue[] = prevInteractiveState?.barValues ?? [];
            const valueIndex = barValues.findIndex(b => b.index === index);
            if (valueIndex === -1) {
              barValues = [...barValues, newBarValue];
            } else {
              barValues = barValues.map(b => b.index === index ? newBarValue : b);
            }
            return {...prevInteractiveState, barValues};
          });
          chartRef.current?.update("none"); // "none" to disable animations
        }, 0);
      }
      return prevData;
    });
  }, [authoredState, log, max, normalizeValue, setInteractiveState]);

  if (!options || !data) {
    return null;
  }

  const hasHorizontalLabel = !!authoredState.yAxisLabel && authoredState.yAxisOrientation === "horizontal";
  return (
    <div className={css.barChart}>
      <div className={css.chart}>
        <div
          className={classnames(css.yAxisLabel, {[css.horizontalLabel]: hasHorizontalLabel, [css.verticalLabel]: !hasHorizontalLabel})}
          tabIndex={yAxisTabIndex}
          data-cy="yAxisLabel">
          <DynamicText>{authoredState.yAxisLabel}</DynamicText>
        </div>
        <div className={css.chartAndXAxisLabel}>
          {authoredState.title && <div className={css.title} tabIndex={titleTabIndex} data-cy="title"><DynamicText>{authoredState.title}</DynamicText></div>}
          <div className={css.chartContainer}>
            <Bar options={options} data={data} ref={chartRef} />

            {chartInfo && <div className={css.barValues} data-cy="barValues">
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
                return <div key={index} style={style} tabIndex={StartChartTabIndex + (2 * index)} title={title} data-cy={`barValue${index}`}><DynamicText inline={true}>{value}</DynamicText></div>;
              })}
              {!readOnly && chartInfo.bars.map(renderedBar => {
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
          {authoredState.xAxisLabel && <div className={css.xAxisLabel} tabIndex={xAxisTabIndex} data-cy="xAxisLabel"><DynamicText>{authoredState.xAxisLabel}</DynamicText></div>}
        </div>
      </div>
    </div>
  );
};
