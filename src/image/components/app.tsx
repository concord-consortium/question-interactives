import React from "react";
import { BaseQuestionApp } from "../../shared/components/base-question-app";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  url?: string;
  altText?: string;
  caption?: string;
  credit?: string;
  creditLink?: string;
  creditLinkDisplayText?: string;
  allowLightbox?: boolean;
  fullWidth?: boolean;
}

export interface IInteractiveState {
  viewed: boolean;
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
      altText: {
        title: "Alt Text",
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
      creditLinkDisplayText: {
        title: "Credit Link Display Text",
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
    altText: {
      "ui:widget": "textarea",
      "ui:help": "Alt text is the written copy that appears in place of an image on a webpage if the image fails to load on a user's screen. This text helps screen-reading tools describe images to visually impaired readers"
    },
    caption: {
      "ui:widget": "textarea"
    },
    credit: {
      "ui:widget": "textarea"
    },
    creditLink: {
      "ui:widget": "textarea",
      "ui:help": "Link to attribution"
    },
    creditLinkDisplayText: {
      "ui:help": "Text to display for the link to attribution (leave blank to display the url)"
    },
    allowLightbox: {
      "ui:help": "Allow image to be shown in lightbox"
    },
    fullWidth: {
      "ui:help": "Make the image take up all available width (full width layout only)"
    }
  }
};

const isAnswered = (interactiveState: IInteractiveState) => interactiveState?.viewed;

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
  />
);
