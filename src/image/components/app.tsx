import React from "react";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  url?: string;
  caption?: string;
  credit?: string;
  creditLink?: string;
  allowLightbox?: boolean;
  fullWidth?: boolean;
}

export interface IInteractiveState {
  submitted?: boolean;
}

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      url: {
        title: "Url",
        type: "string"
      },
      caption: {
        title: "Caption",
        type: "string"
      },
      credit: {
        title: "Credit",
        type: "string"
      },
      creditLink: {
        title: "Credit Link",
        type: "string"
      },
      allowLightbox: {
        title: "Allow lightbox",
        type: "boolean"
      },
      fullWidth: {
        title: "Full width",
        type: "boolean"
      }
    }
  } as JSONSchema6,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
    url: {
      "ui:widget": "textarea",
      "ui:help": "Path to hosted image file (jpg, png, gif, etc)"
    },
    caption: {
      "ui:widget": "textarea"
    },
    credit: {
      "ui:widget": "textarea"
    },
    creditLink: {
      "ui:widget": "textarea",
      "ui:help": "Path to more information on the source of the image"
    },
    allowLightbox: {
      "ui:help": "Allow image to be shown in lightbox"
    },
    fullWidth: {
      "ui:help": "Make the image take up all available width (full width layout only)"
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState | undefined) => true;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
