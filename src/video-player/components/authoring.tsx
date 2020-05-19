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
  prompt?: string;
  disableNextButton?: boolean;
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
    prompt: {
      title: "Prompt",
      type: "string"
    },
    disableNextButton: {
      title: "Disable \"Next\" button",
      type: "boolean"
    }
  }
};

const uiSchema = {
  version: {
    "ui:widget": "hidden"
  },
  videoUrl: {
    "ui:widget": "textarea"
  },
  captionUrl: {
    "ui:widget": "textarea"
  },
  prompt: {
    "ui:widget": "textarea"
  },
  disableNextButton: {
    "ui:widget": "checkbox"
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
