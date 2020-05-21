import React from "react";
import Form, { IChangeEvent } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";

import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  videoUrl: string;
  captionUrl?: string;
  poster?: string;
  prompt?: string;
  credit?: string;
  creditLinkDisplayText?: string;
  creditLink?: string;
  disableNextButton?: boolean;
  fixedAspectRatio?: string;
  fixedHeight?: number;
}

const schemaVersion = 1;
const schema: JSONSchema6 = {
  type: "object",
  properties: {
    version: {
      type: "number",
      default: schemaVersion
    },
    videoUrl: {
      title: "Video Url",
      type: "string"
    },
    captionUrl: {
      title: "Caption Url",
      type: "string"
    },
    poster: {
      title: "Poster / preview image",
      type: "string"
    },
    prompt: {
      title: "Prompt",
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
    disableNextButton: {
      title: "Disable \"Next\" button",
      type: "boolean"
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
};

const uiSchema = {
  version: {
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
    "ui:help": "Path to a static image to display before video playback begins"
  },
  prompt: {
    "ui:widget": "textarea"
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
  disableNextButton: {
    "ui:widget": "checkbox",
    "ui:help": "Students must watch the whole video before they can proceed"
  },
  fixedAspectRatio: {
    "ui:help": "Specify either a number (1.33, 0.75, etc), or use a:b notation (16:9, 4:3, 1:1). Leave blank for responsive behavior"
  },
  fixedHeight: {
    "ui:help": "Specify a fixed height, or leave blank for responsive behavior"
  }
};

interface IProps {
  authoredState: IAuthoredState;
  setAuthoredState?: (state: IAuthoredState) => void;
}

export const Authoring: React.FC<IProps> = ({ authoredState, setAuthoredState }) => {
  const onChange = (event: IChangeEvent<IAuthoredState>) => {
    // Immediately save the data.
    if (setAuthoredState) {
      setAuthoredState(event.formData);
    }
  };

  return (
    <div className={css.authoring}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={authoredState}
        onChange={onChange}
        noValidate={true}
      >
        {/* Children are used to render custom action buttons. We don't want any, */}
        {/* as form is saving and validating data live. */}
        <span />
      </Form>
    </div>
  );
};
