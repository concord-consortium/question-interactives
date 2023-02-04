import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Runtime } from "./runtime";
import { IAuthoredState, IInteractiveState } from "./types";

export const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      questionType: {
        type: "string",
        default: "iframe_interactive",
      },
      videoUrl: {
        title: "Video Url",
        type: "string"
      },
      captionUrl: {
        title: "Closed Caption / Subtitles VTT File URL",
        type: "string"
      },
      poster: {
        title: "Poster / preview image",
        type: "string"
      },
      prompt: {
        title: "Description",
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
      fixedAspectRatio: {
        title: "Fixed Aspect Ratio",
        type: "string"
      },
      fixedHeight: {
        title: "Fixed Height",
        type: "number"
      }
    }
  } as RJSFSchema,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
    questionType: {
      "ui:widget": "hidden"
    },
    videoUrl: {
      "ui:widget": "textarea",
      "ui:help": "Path to hosted video file (mp4, webm, ogg, etc)"
    },
    captionUrl: {
      "ui:widget": "textarea",
      "ui:help": "Path to subtitles or captions, if available"
    },
    poster: {
      "ui:widget": "imageUpload",
      "ui:help": "Path to a static image to display before video playback begins"
    },
    prompt: {
      "ui:widget": "textarea",
      "ui:help": "Text that will appear above the video"
    },
    caption: {
      "ui:widget": "textarea",
      "ui:help": "Text that will appear below the video, before the credits"
    },
    credit: {
      "ui:widget": "textarea"
    },
    creditLink: {
      "ui:widget": "uri",
      "ui:help": "Link to attribution"
    },
    creditLinkDisplayText: {
      "ui:help": "Text to display for the link to attribution (leave blank to display the url)"
    },
    // Behavior properties
    fixedAspectRatio: {
      "ui:help": "Specify either a number (1.33, 0.75, etc), or use a:b notation (16:9, 4:3, 1:1). Leave blank for responsive behavior"
    },
    fixedHeight: {
      "ui:help": "Specify a fixed height, or leave blank for responsive behavior"
    }
  },
};

const isAnswered = (interactiveState: IInteractiveState) => interactiveState?.percentageViewed > 0.95;

export const App = () => {
  return (
    <BaseQuestionApp<IAuthoredState, IInteractiveState>
      Runtime={Runtime}
      baseAuthoringProps={baseAuthoringProps}
      isAnswered={isAnswered}
      disableAutoHeight={false}
    />
  );
};
