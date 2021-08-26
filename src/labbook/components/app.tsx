import React from "react";
import { JSONSchema6 } from "json-schema";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { FormValidation } from "react-jsonschema-form";
import { baseAuthoringProps as drawingToolBaseAuthoringProps } from "../../drawing-tool/components/app";
import deepmerge from "deepmerge";
const baseAuthoringProps = deepmerge(drawingToolBaseAuthoringProps, {
  schema: {
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "iframe_interactive"
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
      },
      backgroundSource: {
        title: "Background source",
        type: "string",
        default: "any"
      }
    }
  } as JSONSchema6,

  uiSchema: {
    "ui:order": [
      "maxItems", "showItems", "questionType"
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
    },
    backgroundSource: {
      "ui:widget": "hidden"
    }
  },
  // Just overwrite array, don't merge values.
  arrayMerge: (destinationArray:any, sourceArray:any) => sourceArray,
  validate: (formData: IAuthoredState, errors: FormValidation) => {
    // TODO: Some actual validation would be good.
    return errors;
  }
});

// TODO: Figure out a better heuristic
const isAnswered = (interactiveState: IInteractiveState | null) => true;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={true}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
