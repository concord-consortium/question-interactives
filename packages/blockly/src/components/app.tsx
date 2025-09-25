import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { FieldProps, RJSFSchema } from "@rjsf/utils";
import React from "react";

import { CustomBlockEditor } from "./custom-block-editor";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";

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
      customBlocks: {
        title: "Custom Blocks",
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["creator", "setter"] },
            name: { type: "string" },
            color: { type: "string" },
            config: { type: "object" }
          }
        }
      },
      toolbox: {
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
    customBlocks: {
      "ui:field": "customBlockEditor"
    },
    toolbox: {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 15
      }
    }
  },
  fields: {
    customBlockEditor: CustomBlockEditor
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
          // Extract the actual customBlocks array from the nested structure
          const customBlocks = props.formData?.customBlocks?.customBlocks || props.formData?.customBlocks || [];
          
          // Get the full form data from formContext
          const fullFormData = props.registry?.formContext?.authoredState || {};
          
          return (
            <CustomBlockEditor 
              {...props} 
              value={Array.isArray(customBlocks) ? customBlocks : []} 
              formData={fullFormData}
              onChange={props.onChange}
              onChangeFormData={props.onChange}
            />
          );
        }
      }
    }}
    isAnswered={isAnswered}
  />
);
