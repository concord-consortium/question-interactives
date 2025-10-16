import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { FieldProps, RJSFSchema } from "@rjsf/utils";
import React from "react";

import { CustomBlockEditor } from "./custom-block-editor";
import { Runtime } from "./runtime";
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";

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
      simulationCode: {
        title: "Simulation Code",
        type: "string"
      },
      customBlocks: {
        title: "Custom Blocks",
        type: "array",
        default: [],
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["action", "builtIn", "condition", "creator", "setter", "statement"] },
            name: { type: "string" },
            color: { type: "string" },
            category: { type: "string" },
            config: { type: "object" }
          }
        }
      },
      toolbox: {
        default: DefaultAuthoredState.toolbox || "",
        title: "Toolbox",
        type: "string"
      }
    }
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "prompt",
      "required",
      "*"
    ],
    version: {
      "ui:widget": "hidden"
    },
    questionType: {
      "ui:widget": "hidden"
    },
    prompt: {
      "ui:widget": "richtext"
    },
    hint: {
      "ui:widget": "richtext"
    },
    simulationCode: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 15
      }
    },
    customBlocks: {
      "ui:field": "customBlockEditor"
    },
    toolbox: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 15
      }
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => {
  return true;
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={{
      schema: baseAuthoringProps.schema,
      uiSchema: baseAuthoringProps.uiSchema,
      fields: {
        customBlockEditor: (props: FieldProps<any, RJSFSchema, any>) => {
          const value = Array.isArray(props.formData) ? props.formData : [];
          const authoredState = props.registry?.formContext?.authoredState || {};
          const toolbox = authoredState.toolbox || "";
          
          return (
            <CustomBlockEditor
              customBlocks={value}
              onChange={props.onChange}
              toolbox={toolbox}
            />
          );
        }
      }
    }}
    isAnswered={isAnswered}
  />
);