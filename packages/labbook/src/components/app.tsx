import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";
import { baseAuthoringProps as drawingToolBaseAuthoringProps, exportToMediaLibrary } from "drawing-tool-interactive/src/components/app";
import deepmerge from "deepmerge";

export const ToolbarModificationsWidget = (props: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.checked);

  return (
    <div className="checkbox">
      <label>
        <input type="checkbox" id={props.id} checked={!!props.value} onChange={handleChange} />
        <span>{props.schema.customLabel}</span>
      </label>
    </div>
  );
};

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
      },
      hideAnnotationTool: {
        title: "Toolbar Modifications",
        customLabel: "Hide Annotation Tool",
        type: "boolean",
        default: false
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
    hideAnnotationTool: {
      "ui:widget": ToolbarModificationsWidget
    },
  },
  // Just overwrite array, don't merge values.
  arrayMerge: (destinationArray:any, sourceArray:any) => sourceArray
});

// This list combines all the fields from drawing-tool app and custom ones specified by Labbook.
baseAuthoringProps.uiSchema["ui:order"] = [
  "prompt", "required", "predictionFeedback", "hint", "backgroundSource", "showUploadImageButton", "snapshotTarget",
  "backgroundImageUrl", "imageFit", "imagePosition", "hideAnnotationTool",  "stampCollections", "maxItems", "showItems", "version", "questionType",
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
