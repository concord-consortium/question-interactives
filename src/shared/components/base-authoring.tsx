import React from "react";
import Form, { Field, IChangeEvent, UiSchema } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";

import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";

export interface IBaseAuthoringProps<IAuthoredState> {
  authoredState: IAuthoredState;
  setAuthoredState?: (state: IAuthoredState) => void;
  preprocessFormData?: (data: IAuthoredState) => IAuthoredState;
  // react-jsonschema-form properties:
  schema: JSONSchema6;
  uiSchema: UiSchema;
  // react-jsonschema-form additional fields.
  fields?: { [name: string]: Field };
}

export const BaseAuthoring = <IAuthoredState,>({ authoredState, setAuthoredState, preprocessFormData, schema, uiSchema, fields }: IBaseAuthoringProps<IAuthoredState>) => {
  const onChange = (event: IChangeEvent) => {
    let formData = event.formData;
    if (preprocessFormData) {
      formData = preprocessFormData(formData);
    }
    // Immediately save the data.
    if (setAuthoredState) {
      setAuthoredState(formData);
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
        fields={fields}
      >
        {/* Children are used to render custom action buttons. We don't want any, */}
        {/* as form is saving and validating data live. */}
        <span />
      </Form>
    </div>
  );
};
