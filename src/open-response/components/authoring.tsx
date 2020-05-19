import React from "react";
import Form, { IChangeEvent } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";

import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IAuthoredState {
  version: number;
  prompt?: string;
  extraInstructions?: string;
  defaultAnswer?: string;
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
    extraInstructions: {
      title: "Extra instructions",
      type: "string"
    },
    defaultAnswer: {
      type: "string",
      title: "Default answer"
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
  defaultAnswer: {
    "ui:widget": "textarea"
  },
};

interface IProps {
  authoredState: IAuthoredState | null;
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
