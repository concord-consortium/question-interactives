import React from "react";
import ReactDOM from "react-dom";
import { DemoComponent } from "../shared/components/demo";
import { App } from "./components/app";
import { IAuthoredState, IInteractiveState } from "./components/types";

const DemoContainer = () => {
  const authoredState: IAuthoredState = {
    version: 1,
    questionType: "iframe_interactive"
  };
  const interactiveState: IInteractiveState = {
    answerType: "interactive_state"
  };

  return (
    <DemoComponent<IAuthoredState, IInteractiveState>
      title="Bar Graph Demo"
      App={<App />}
      authoredState={authoredState}
      interactiveState={interactiveState}
    />
  );
};

ReactDOM.render(
  <DemoContainer />,
  document.getElementById("app")
);
