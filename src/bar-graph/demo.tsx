import React from "react";
import ReactDOM from "react-dom";
import { DemoComponent } from "../shared/components/demo";
import { App } from "./components/app";
import { IAuthoredState, IInteractiveState } from "./components/types";

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  title: "Estimate Spring and Summer Sunlight",
  xAxisLabel: "Seasons",
  yAxisLabel: "Days of Sunlight",
  yAxisOrientation: "horizontal",
  maxYValue: 100,
  yAxisCountBy: 10,
  showValuesAboveBars: true,
  numberOfDecimalPlaces: 0,
  bars: [
    {label: "Winter", value: 25, lockValue: true, color: "#EA6D2F"},
    {label: "Spring", value: 0, lockValue: false, color: "#FFC320"},
    {label: "Summer", value: 0, lockValue: false, color: "#2DA343"},
    {label: "Fall", value: 50, lockValue: true, color: "#6FC6DA"}
  ]
};

const DemoContainer = () => {
  const interactiveState: IInteractiveState = {
    answerType: "interactive_state"
  };

  return (
    <DemoComponent<IAuthoredState, IInteractiveState>
      title="Bar Graph Demo"
      App={<App />}
      authoredState={DemoAuthoredState}
      interactiveState={interactiveState}
    />
  );
};

ReactDOM.render(
  <DemoContainer />,
  document.getElementById("app")
);
