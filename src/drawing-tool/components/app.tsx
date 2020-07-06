import React from "react";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";
import { IAuthoringOpenResponseMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";
import { BaseQuestionApp } from "../../shared/components/base-question-app";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState extends IAuthoringOpenResponseMetadata {
  version: number;
  backgroundImageUrl?: string;
  imageFit: string;
  imagePosition: string;
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {}

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      backgroundImageUrl: {
        title: "Background Image URL",
        type: "string",
        format: "uri"
      },
      imageFit: {
        title: "Background image fit",
        type: "string",
        default: "shrinkBackgroundToCanvas",
        enum: [
          "shrinkBackgroundToCanvas",
          "resizeBackgroundToCanvas",
          "resizeCanvasToBackground"
        ],
        enumNames: [
          "Shrink image if needed (do not grow)",
          "Set image to canvas size",
          "Set canvas to image size"
        ]
      },
      imagePosition: {
        title: "Background image position (for smaller images)",
        type: "string",
        default: "center",
        enum: [
          "center",
          "top-left"
        ],
        enumNames: [
          "Center",
          "Top-left"
        ]
      }
    }
  } as JSONSchema6,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
    backgroundImageUrl: {
      "ui:help": "Path to hosted image file (jpg, png, gif, etc)"
    },
    imageFit: {
      "ui:widget": "radio"
    },
    imagePosition: {
      "ui:widget": "radio"
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | null) => !!interactiveState?.answerText;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    isAnswered={isAnswered}
  />
);
