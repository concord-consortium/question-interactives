import React, { useEffect, useRef } from "react";
import Form, { Field, FormValidation, IChangeEvent, UiSchema } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";
import { useDelayedValidation } from "../hooks/use-delayed-validation";
import { RichTextWidget } from "../widgets/rich-text/rich-text-widget";
import { ILinkedInteractiveProp, useLinkedInteractivesAuthoring } from "../hooks/use-linked-interactives-authoring";
import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import css from "../../shared/styles/authoring.scss";

export interface IBaseAuthoringProps<IAuthoredState> {
  authoredState: IAuthoredState;
  setAuthoredState: (state: IAuthoredState) => void;
  preprocessFormData?: (data: IAuthoredState) => IAuthoredState;
  // react-jsonschema-form properties:
  schema: JSONSchema6;
  uiSchema?: UiSchema;
  // react-jsonschema-form additional fields.
  fields?: { [name: string]: Field };
  validate?: (formData: IAuthoredState, errors: FormValidation) => FormValidation;
  linkedInteractiveProps?: ILinkedInteractiveProp[];
}

export interface IFormContext<IAuthoredState> {
  authoredState: IAuthoredState;
}

// custom widgets
const widgets = {
  richtext: RichTextWidget
};

export const BaseAuthoring = <IAuthoredState,>({ authoredState, setAuthoredState, preprocessFormData, schema, uiSchema, fields, validate, linkedInteractiveProps }: IBaseAuthoringProps<IAuthoredState>) => {
  const formRef = useRef<Form<IAuthoredState>>(null);
  const triggerDelayedValidation = useDelayedValidation({ formRef });

  const onChange = (event: IChangeEvent) => {
    let formData = event.formData;
    if (preprocessFormData) {
      formData = preprocessFormData(formData);
    }
    // Immediately save the data.
    setAuthoredState?.(formData);
    validate && triggerDelayedValidation();
  };

  useEffect(() => {
    // Initial validation (if necessary).
    validate && triggerDelayedValidation();
  }, [validate, triggerDelayedValidation]);

  // This hook provides list of interactives on a given page and saving of the linked interactive IDs.
  const schemaWithInteractives = useLinkedInteractivesAuthoring({ linkedInteractiveProps, schema });

  return (
    <div className={css.authoring}>
      <Form
        ref={formRef}
        schema={schemaWithInteractives}
        uiSchema={uiSchema}
        widgets={widgets}
        formData={authoredState || {}}
        onChange={onChange}
        fields={fields}
        validate={validate}
        formContext={{
          // Pass authored state in context, so custom field can access the complete authored state.
          // It's useful quite often, e.g. when field rendering is based on previous form inputs.
          // Currently used by drag and drop - `initialState` field is using list of draggable items.
          authoredState: authoredState || {}
        }}
      >
        {/* Children are used to render custom action buttons. We don't want any, */}
        {/* as form is saving and validating data live. */}
        <span />
      </Form>
    </div>
  );
};
