import React from "react";
import ReactDOM from "react-dom";
import { DemoComponent } from "@concord-consortium/question-interactives-helpers/src/components/demo";
import { App } from "./components/app";
import { IAuthoredState, IInteractiveState, DemoAuthoredState } from "./components/types";

const DemoContainer = () => {
  const interactiveState: IInteractiveState = {
    answerType: "interactive_state"
  };

  return (
    <DemoComponent<IAuthoredState, IInteractiveState>
      title="Drawing Tool Demo"
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
