import React from "react";
import ReactDOM from "react-dom";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../shared/components/base-question-app";
import { Runtime } from "./components/runtime";
import { IframeAuthoring } from "./components/iframe-authoring";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  prompt?: string;
  required?: boolean;
  extraInstructions?: string;
  subinteractives: {
    id: string;
    url: string;
    authoredState: any;
  }[]
}

export interface IInteractiveState {
  subinteractiveStates: {
    [id: string]: any;
  },
  currentSubinteractiveId: string;
  submitted: boolean;
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
    extraInstructions: {
      title: "Hint",
      type: "string"
    },
    subinteractives: {
      type: "array",
      title: "Subquestions",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          url: {
            type: "string"
          },
          authoredState: {
            type: "any"
          }
        }
      }
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
  extraInstructions: {
    "ui:widget": "textarea"
  },
  subinteractives: {
    items: {
      "ui:field": "iframeAuthoring"
    }
  }
};

const fields = {
  iframeAuthoring: IframeAuthoring
};

const App = () => {
  return (
    <BaseQuestionApp<IAuthoredState, IInteractiveState>
      baseAuthoringProps={{ schema, uiSchema, fields }}
      Runtime={Runtime}
      disableSubmitBtnRendering={true}
    />
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
