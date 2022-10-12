import React from "react";
import ReactDOM from "react-dom";
import { DemoComponent } from "../shared/components/demo";
import { App } from "./components/app";
import { IAuthoredState, IInteractiveState } from "./components/types";
import { DemoAuthoredState } from "./demo-authored-state";

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
