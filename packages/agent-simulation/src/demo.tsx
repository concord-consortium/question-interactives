import React from "react";
import ReactDOM from "react-dom";
import { DemoComponent } from "@concord-consortium/question-interactives-helpers/src/components/demo";
import { App } from "./components/app";
import { getReportItemHtml } from "./components/report-item/get-report-item-html";
import { IAuthoredState, IInteractiveState, DemoAuthoredState } from "./components/types";

const DemoContainer = () => {
  const interactiveState: IInteractiveState = {
    answerType: "interactive_state",
    version: 1,
  };

  return (
    <DemoComponent<IAuthoredState, IInteractiveState>
      title="Agent Simulation Demo"
      App={<App />}
      authoredState={DemoAuthoredState}
      interactiveState={interactiveState}
      getReportItemHtml={getReportItemHtml}
    />
  );
};

ReactDOM.render(
  <DemoContainer />,
  document.getElementById("app")
);
