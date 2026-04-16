import React from "react";
import ReactDOM from "react-dom";
import { DemoComponent, DEMO_RUNTIME_INTERACTIVE_ID } from "@concord-consortium/question-interactives-helpers/src/components/demo";
import { PubSubSimulationConfig } from "@concord-consortium/question-interactives-helpers/src/components/pub-sub-simulation";
import { App } from "./components/app";
import { IAuthoredState } from "./components/types";

const demoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  dataSourceInteractive: DEMO_RUNTIME_INTERACTIVE_ID,
  chartTitle: "Live Graph Demo",
  xAxisColumn: "tick",
  xAxisLabel: "Tick",
  xAxisMax: 50,
  yAxisLabel: "Value",
  yAxisRangeMode: "auto",
  columnDisplayNames: "temperature=Temperature\nnoise=Noise\nbaseline=Baseline\nfuzzy=Fuzzy Wave",
  columnFilteringMode: "all",
  noDataMessage: "Waiting for data...",
  noSourceMessage: "No data source configured",
};

const pubSubSimulation: PubSubSimulationConfig = {
  tickRate: 250,
  columns: [
    { name: "tick", start: 0, generator: "increment", delta: 1, step: 1 },
    { name: "temperature", start: 50, generator: "sine", min: 0, max: 100, period: 40 },
    { name: "noise", generator: "random", min: 0, max: 10, step: 2 },
    { name: "baseline", generator: "constant", value: 50 },
    { name: "fuzzy", generator: "custom-fuzzy-wave", step: 4 },
  ],
  customGenerators: {
    "custom-fuzzy-wave": {
      name: "Fuzzy wave",
      fn: (tickIndex: number, prev: number | null) => {
        const base = 50 + 30 * Math.sin(2 * Math.PI * tickIndex / 60);
        const wobble = (Math.random() - 0.5) * 5;
        return prev !== null ? (prev + base) / 2 + wobble : base + wobble;
      },
    },
  },
};

const DemoContainer = () => {
  return (
    <DemoComponent<IAuthoredState, Record<string, never>>
      title="Live Graph Demo"
      App={<App />}
      authoredState={demoAuthoredState}
      interactiveState={{}}
      pubSubSimulation={pubSubSimulation}
    />
  );
};

ReactDOM.render(
  <DemoContainer />,
  document.getElementById("app")
);
