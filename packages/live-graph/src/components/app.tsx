import React from "react";
import { BaseApp } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { IAuthoredState } from "./types";
import { Runtime } from "./runtime";
import { Authoring } from "./authoring";

export const App = () => (
  <BaseApp<IAuthoredState>
    Runtime={Runtime}
    Authoring={Authoring}
    disableAutoHeight={false}
    linkedInteractiveProps={[{ label: "dataSourceInteractive" }]}
  />
);
