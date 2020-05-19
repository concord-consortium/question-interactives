import React from "react";
import Form, { IChangeEvent } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";
import { v4 as uuidv4 } from "uuid";

import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export interface IChoice {
  id: string;
  content: string;
  correct?: boolean;
}

export interface IAuthoredState {
  version: number;
  prompt?: string;
  extraInstructions?: string;
  multipleAnswers?: boolean;
  choices?: IChoice[];
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
    multipleAnswers: {
      type: "boolean",
      title: "Allow multiple answers",
      default: false
    },
    choices: {
      type: "array",
      title: "Choices",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          content: {
            type: "string",
            title: "Choice text",
            default: "choice"
          },
          correct: {
            type: "boolean",
            title: "Correct",
            default: false
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
  choices: {
    items: {
      id: {
        "ui:widget": "hidden"
      }
    }
  }
};

const defaultState: IAuthoredState = {
  version: 1,
  prompt: "",
  multipleAnswers: false,
  choices: [
    {
      id: "1",
      content: "Choice A",
      correct: false
    },
    {
      id: "2",
      content: "Choice B",
      correct: false
    },
    {
      id: "3",
      content: "Choice C",
      correct: false
    }
  ]
};

interface IProps {
  authoredState: IAuthoredState | null;
  setAuthoredState?: (state: IAuthoredState) => void;
}

export const Authoring: React.FC<IProps> = ({ authoredState, setAuthoredState }) => {
  const onChange = (event: IChangeEvent<IAuthoredState>) => {
    const formData = event.formData as IAuthoredState;
    // Generate choice ID if necessary.
    formData.choices?.forEach(choice => {
      if (choice.id === undefined) {
        choice.id = uuidv4();
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
        formData={authoredState || defaultState}
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
