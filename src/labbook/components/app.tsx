import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { FormValidation } from "react-jsonschema-form";
const baseAuthoringProps = {
  schema: {
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "labbook"
      },
      maxItems: {
        type: "number",
        title: "Maximum number of lab book entries",
        default: 12
      },
      showItems: {
        type: "number",
        title: "How many thumbnails to display",
        default: 4
      }
    }
  } as JSONSchema6,

  uiSchema: {
    "ui:order": [
      "maxItems", "showItems", "questionType", "version"
    ],
    maxItems: {
      "ui:widget": "updown"
    },
    showItems: {
      "ui:widget": "updown"
    },
    version: {
      "ui:widget": "hidden"
    },
    questionType: {
      "ui:widget": "hidden"
    }
  },
  // Just overwrite array, don't merge values.
  arrayMerge: (destinationArray:any, sourceArray:any) => sourceArray,
  validate: (formData: IAuthoredState, errors: FormValidation) => {
    return errors;
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.answerText;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={true}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
