
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DefaultBarColor } from "../bar-chart";
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "../types";

const chartHeight = 50;

export const getReportItemHtml = ({ interactiveState, authoredState }: { interactiveState: IInteractiveState; authoredState: IAuthoredState; }) => {
  // get the chart setup
  const chartRange = authoredState.maxYValue || DefaultAuthoredState.maxYValue;
  const barValues = interactiveState.barValues || [];
  const bars = authoredState.bars.map((bar, index) => {
    const {label, value, color} = bar;
    const barValue = barValues.find(b => b.index === index);
    return {
      index,
      label,
      value: barValue?.hasValue ? barValue.value : (value || 0),
      color: color || DefaultBarColor
    };
  });

  const chartBars = bars.map(bar => {
    const style: React.CSSProperties = {
      height: (bar.value / chartRange) * chartHeight,
      backgroundColor: bar.color
    };
    return <div className="chartBar" style={style} key={bar.index} />;
  });

  const barInfo = bars.map(bar => {
    const style: React.CSSProperties = {
      color: bar.color
    };
    return (
      <div className="bar" key={bar.index}>
        <div className="barValue" style={style}>{bar.value}</div>
        <div className="barLabel">{bar.label}</div>
      </div>
    );
  });

  const metrics = renderToStaticMarkup(
    <div className="metrics">
      <div className="chart">
        {chartBars}
      </div>
      <div className="bars">
        {barInfo}
      </div>
    </div>
  );

  // make the bars fatter when less than 4 bars show
  const chartBarWidth = 15 + ((4 - Math.min(4, bars.length)) * 10);

  return `
  <style>
    .tall {
      flex-direction: row;
    }
    .chart {
      display: flex;
      flex-direction: row;
      gap: 5px;
      align-items: flex-end;
      justify-content: space-around;
      padding: 0 5px;
      min-width: 75px;
      height: ${chartHeight}px;
      border: 1px solid #aaa;
      color: #3f3f3f;
    }
    .chartBar {
      width: ${chartBarWidth}px;
    }
    .metrics {
      display: flex;
      flex-direction: row;
      gap: 20px;
    }
    .bars {
      display: flex;
      flex-direction: row;
      gap: 20px;
    }
    .bar {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .barValue {
      font-size: 28px;
      font-weight: bold;
    }
    .barLabel {
      font-size: 16px;
    }
  </style>
  <div class="tall">
    ${metrics}
  </div>
  <div class="wide">
    ${metrics}
  </div>
  `;
};
