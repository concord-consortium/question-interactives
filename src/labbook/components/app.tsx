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
        default: "snapshot"
      }
    }
  } as JSONSchema6,

  uiSchema: {
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
    // TODO: Some actual validation would be good.
    return errors;
  }
});

// This list combines all the fields from drawing-tool app and custom ones specified by Labbook.
baseAuthoringProps.uiSchema["ui:order"] = [
  "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "showUploadImageButton", "snapshotTarget",
  "backgroundImageUrl", "imageFit", "imagePosition",  "stampCollections", "maxItems", "showItems", "version", "questionType"
];

// Show "Show Upload Image button" checkbox only when user doesn't select "Upload" as background source.
// In such case, this button must be shown.
(baseAuthoringProps as any).schema.dependencies.backgroundSource.oneOf.filter((item: any) =>
  item.properties.backgroundSource.enum[0] !== "upload"
).forEach((item: any) => {
  item.properties.showUploadImageButton = {
    type: "boolean",
    title: "Show Upload Image button",
    default: true
  };
});

// TODO: Figure out a better heuristic
const isAnswered = (interactiveState: IInteractiveState | null) => true;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
