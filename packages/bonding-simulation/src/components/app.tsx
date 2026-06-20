import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";

import { IAuthoredState, IInteractiveState } from "./types";
import { Runtime } from "./runtime";

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "iframe_interactive"
      },
      prompt: {
        title: "Prompt",
        type: "string"
      },
      required: {
        title: "Required (Show submit and lock button)",
        type: "boolean"
      },
      hint: {
        title: "Hint",
        type: "string"
      },
      chamberWidth: {
        title: "Chamber Width",
        type: "number",
        default: 300,
      },
      chamberHeight: {
        title: "Chamber Height",
        type: "number",
        default: 300,
      },
      gridStep: {
        title: "Grid Step",
        type: "number",
        default: 10,
      },
      initialH: {
        title: "Initial Hydrogen atoms",
        type: "number",
        default: 15,
        minimum: 0,
        maximum: 50,
      },
      initialO: {
        title: "Initial Oxygen atoms",
        type: "number",
        default: 8,
        minimum: 0,
        maximum: 25,
      },
      initialCl: {
        title: "Initial Chlorine atoms",
        type: "number",
        default: 4,
        minimum: 0,
        maximum: 25,
      },
      initialCH4: {
        title: "Initial CH₄ (fuel) molecules",
        type: "number",
        default: 3,
        minimum: 0,
        maximum: 10,
      },
      initialTemperature: {
        title: "Initial Temperature (K)",
        type: "number",
        default: 350,
        minimum: 100,
        maximum: 1000,
      },
    },
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "prompt",
      "required",
      "hint",
      "chamberWidth",
      "chamberHeight",
      "gridStep",
      "initialH",
      "initialO",
      "initialCl",
      "initialCH4",
      "initialTemperature",
      "*"
    ],
    version: { "ui:widget": "hidden" },
    questionType: { "ui:widget": "hidden" },
    prompt: { "ui:widget": "richtext" },
    hint: { "ui:widget": "richtext" },
  },
};

const isAnswered = (interactiveState: IInteractiveState | null) => true;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
