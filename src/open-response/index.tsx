import React from "react";
import ReactDOM from "react-dom";
import { BaseQuestionApp } from "../shared/components/base-question-app";
import { Runtime } from "./components/runtime";
import { JSONSchema6 } from "json-schema";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  prompt?: string;
  defaultAnswer?: string;
  hint?: string;
  required?: boolean;
}

export interface IInteractiveState {
  response?: string;
  submitted?: boolean;
}

const schemaVersion = 1;
const schema: JSONSchema6 = {
  type: "object",
  properties: {
    version: {
      type: "number",
      default: schemaVersion
    },
    prompt: {
      title: "Prompt",
      type: "string"
    },
    required: {
      title: "Required",
      type: "boolean"
    },
    hint: {
      title: "Hint",
      type: "string"
    },
    defaultAnswer: {
      type: "string",
      title: "Default answer"
    }
  }
};

const uiSchema = {
  version: {
    "ui:widget": "hidden"
  },
  prompt: {
    "ui:widget": "textarea"
  },
  hint: {
    "ui:widget": "textarea"
  },
  defaultAnswer: {
    "ui:widget": "textarea"
  },
};

const isAnswered = (interactiveState: IInteractiveState | undefined) => !!interactiveState?.response;

ReactDOM.render(
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    baseAuthoringProps={{ schema, uiSchema }}
    Runtime={Runtime}
    isAnswered={isAnswered}
  />,
  document.getElementById("app")
);
