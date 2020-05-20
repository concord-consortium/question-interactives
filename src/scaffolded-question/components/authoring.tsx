import React from "react";
import Form, { IChangeEvent } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";
import { IframeAuthoring } from "./iframe-authoring";

import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";
import { v4 as uuidv4 } from "uuid";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  prompt?: string;
  required?: boolean;
  extraInstructions?: string;
  subinteractives: {
    id: string;
    url: string;
    authoredState: any;
  }[]
}

const schemaVersion = 1;
const schema: JSONSchema6 = {
  type: "object",
  properties: {
    version: {
      type: "number",
      default: schemaVersion
    },
    prompt: {
      title: "Prompt",
      type: "string"
    },
    required: {
      title: "Required",
      type: "boolean"
    },
    extraInstructions: {
      title: "Extra instructions",
      type: "string"
    },
    subinteractives: {
      type: "array",
      title: "Subquestions",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          url: {
            type: "string"
          },
          authoredState: {
            type: "any"
          }
        }
      }
    }
  }
};

const uiSchema = {
  version: {
    "ui:widget": "hidden"
  },
  prompt: {
    "ui:widget": "textarea"
  },
  extraInstructions: {
    "ui:widget": "textarea"
  },
  subinteractives: {
    items: {
      "ui:field": "iframeAuthoring"
    }
  }
};

interface IProps {
  authoredState?: IAuthoredState;
  setAuthoredState?: (state: IAuthoredState) => void;
}

export const Authoring: React.FC<IProps> = ({ authoredState, setAuthoredState }) => {
  const onChange = (event: IChangeEvent<IAuthoredState>) => {
    const formData = event.formData as IAuthoredState;
    // Generate interactive ID if necessary.
    formData.subinteractives?.forEach(int => {
      if (!int.id) {
        int.id = uuidv4();
      }
    });
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
        fields={{
          iframeAuthoring: IframeAuthoring
        }}
      >
        {/* Children are used to render custom action buttons. We don't want any, */}
        {/* as form is saving and validating data live. */}
        <span />
      </Form>
    </div>
  );
};
