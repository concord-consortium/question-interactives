import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { baseAuthoringProps as drawingToolBaseAuthoringProps, exportToMediaLibrary } from "drawing-tool-interactive/src/components/app";
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
        default: 12,
        minimum: 1
      },
      showItems: {
        type: "number",
        title: "How many thumbnails to display",
        default: 4,
        minimum: 1
      },
      backgroundSource: {
        title: "Background source",
        type: "string",
        default: "snapshot"
      }
    }
  } as RJSFSchema,

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
    },
  },
  // Just overwrite array, don't merge values.
  arrayMerge: (destinationArray:any, sourceArray:any) => sourceArray
});

// set the available drawing tools
const hideDrawingTools = baseAuthoringProps.schema.properties?.hideDrawingTools as any;
if (hideDrawingTools) {
  hideDrawingTools.items.enum = ['free', 'shapesPalette', 'annotation'];
}

// This list combines all the fields from drawing-tool app and custom ones specified by Labbook.
baseAuthoringProps.uiSchema["ui:order"] = [
  "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "showUploadImageButton", "snapshotTarget",
  "backgroundImageUrl", "imageFit", "imagePosition", "hideDrawingTools", "stampCollections", "maxItems", "showItems", "version", "questionType",
  ...exportToMediaLibrary.uiOrder
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

// Initial interactiveState is undefined. If user removes all the thumbnails, it'll be defined, but the entries
// array will be empty. Both states are considered not to be answered.
const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.entries && interactiveState?.entries?.length > 0;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "snapshotTarget", supportsSnapshots: true }]}
  />
);
