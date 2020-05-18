import React, { useEffect, useRef } from "react";
import Form, { IChangeEvent, FormValidation } from "react-jsonschema-form";
import { JSONSchema6, JSONSchema7 } from "json-schema";

import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";
import { useDelayedValidation } from "../../shared/hooks/use-delayed-validation";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export const defaultBlankSize = 20; // characters
const blankRegexp = /\[blank-\w+\]/g; // will match [blank-1], [blank-test], [blank-second_option] etc.

export interface IBlankDef {
  id: string;
  size: number;
  matchTerm?: string;
}

export interface IAuthoredState {
  version: number;
  prompt?: string;
  extraInstructions?: string;
  blanks?: IBlankDef[]
}

const schemaVersion = 1;
const schema: JSONSchema7 = {
  type: "object",
  properties: {
    version: {
      type: "number",
      default: schemaVersion
    },
    prompt: {
      title: "Prompt. Provide sentence with one or more blanks specified with [blank-<ID>], for example [blank-1], [blank-test].",
      type: "string"
    },
    extraInstructions: {
      title: "Extra instructions",
      type: "string"
    },
    blanks: {
      type: "array",
      title: "Blank field options",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            title: "Blank ID",
            readOnly: true
          },
          size: {
            type: "number",
            title: "Size (number of characters)"
          },
          matchTerm: {
            type: "string",
            title: "Match term"
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
  blanks: {
    "ui:options":  {
      orderable: false,
      removable: false,
      addable: false
    }
  }
};

interface IProps {
  authoredState: IAuthoredState;
  setAuthoredState?: (state: IAuthoredState) => void;
}

const noop = () => { /* noop */ };

export const validate = (formData: IAuthoredState, errors: FormValidation) => {
  if (formData.prompt) {
    const sortedBlanks = (formData?.prompt?.match(blankRegexp) || []).sort();
    for (let i = 0; i < sortedBlanks.length - 1; i++) {
      if (sortedBlanks[i] === sortedBlanks[i + 1]) {
        errors.prompt.addError(`The same blank ID used multiple times: ${sortedBlanks[i]}`);
        return errors;
      }
    }
  }
  return errors;
};

const generateBlankOptions = (authoredState: IAuthoredState) => {
  const blanks = authoredState?.prompt?.match(blankRegexp) || [];
  const newAuthoredState = Object.assign({}, authoredState, { blanks: authoredState?.blanks?.slice() || [] });
  // Check existing blank options and remove ones that are not necessary anymore.
  authoredState.blanks?.forEach(blankOptions => {
    if (!blanks.find(blankId => blankId === blankOptions.id)) {
      // Existing blank options are not matching any keyword in the current prompt. Remove it.
      const idx = newAuthoredState.blanks?.indexOf(blankOptions);
      if (idx !== undefined && idx !== -1) {
        newAuthoredState.blanks.splice(idx, 1);
      }
    }
  });
  // Add new blank options if necessary.
  blanks.forEach(blankId => {
    if (!newAuthoredState.blanks.find(blankOptions => blankOptions.id === blankId)) {
      // New blank keyword found in the prompt. Add a new blank options object.
      newAuthoredState.blanks.push({ id: blankId, size: defaultBlankSize });
    }
  });
  return newAuthoredState;
}

export const Authoring: React.FC<IProps> = ({ authoredState, setAuthoredState }) => {
  const formRef = useRef<Form<IAuthoredState>>(null);
  const triggerDelayedValidation = useDelayedValidation({ formRef });

  const onChange = (event: IChangeEvent<IAuthoredState>) => {
    const newState = generateBlankOptions(event.formData);
    // Immediately save the data.
    if (setAuthoredState) {
      setAuthoredState(newState);
    }
    triggerDelayedValidation();
  };

  useEffect(() => {
    // Initial validation.
    triggerDelayedValidation();
  }, []);

  return (
    <div className={css.authoring}>
      <Form
        ref={formRef}
        schema={schema as JSONSchema6}
        uiSchema={uiSchema}
        formData={authoredState}
        onChange={onChange}
        validate={validate}
        onError={noop} // avoid console.error messages (default react-jsonschema-form error handler)
      >
        {/* Children are used to render custom action buttons. We don't want any, */}
        {/* as form is saving and validating data live. */}
        <span />
      </Form>
    </div>
  );
};
