import React, { useEffect, useRef, useState } from "react";
import { Field, FormValidation, UiSchema } from "@rjsf/utils";
import Form, { IChangeEvent } from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { RJSFSchema } from "@rjsf/utils";
import { useDelayedValidation } from "../hooks/use-delayed-validation";
import { RichTextWidget } from "../widgets/rich-text/rich-text-widget";
import { ImageUploadWidget } from "../widgets/image-upload/image-upload-widget";
import { ILinkedInteractiveProp, useLinkedInteractivesAuthoring } from "../hooks/use-linked-interactives-authoring";
import { getFirebaseJwt } from "@concord-consortium/lara-interactive-api";
import { TokenServiceClient } from "@concord-consortium/token-service";
import { NumberInputWidget } from "../widgets/number-input/number-input";

import css from "../styles/authoring.scss";
import "../styles/bootstrap-3.3.7.scss"; // necessary to style react-jsonschema-form

export interface IBaseAuthoringProps<IAuthoredState> {
  authoredState: IAuthoredState;
  setAuthoredState: (state: IAuthoredState) => void;
  preprocessFormData?: (data: IAuthoredState) => IAuthoredState;
  // react-jsonschema-form properties:
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  // react-jsonschema-form additional fields.
  fields?: { [name: string]: Field };
  validate?: (formData: IAuthoredState, errors: FormValidation) => FormValidation;
  linkedInteractiveProps?: ILinkedInteractiveProp[];
}

export interface IFormContext<IAuthoredState> {
  authoredState: IAuthoredState;
  tokenServiceClient: TokenServiceClient;
}

// custom widgets
const widgets = {
  richtext: RichTextWidget,
  imageUpload: ImageUploadWidget,
  numberInput: NumberInputWidget
};

export const getTokenServiceEnv = (claims: any) => {
  // Provided object usually has nested `claims` object. Keep backward compatibility with old (probably incorrect)
  // format just in case, as it costs us nothing.
  const host = claims?.platform_id || claims?.claims?.platform_id || "";
  return host.match(/learn\.concord\.org/) ? "production" : "staging";
};

export const BaseAuthoring = <IAuthoredState,>({ authoredState, setAuthoredState, preprocessFormData, schema, uiSchema, fields, validate, linkedInteractiveProps }: IBaseAuthoringProps<IAuthoredState>) => {
  const formRef = useRef<Form<IAuthoredState>>(null);
  const triggerDelayedValidation = useDelayedValidation({ formRef });
  const [tokenServiceClient, setTokenServiceClient] = useState<TokenServiceClient>();

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

  // create token service client
  useEffect(() => {
    const getJWT = async () => {
      const jwt = await getFirebaseJwt(TokenServiceClient.FirebaseAppName);
      setTokenServiceClient(new TokenServiceClient({ jwt: jwt.token, env: getTokenServiceEnv(jwt.claims) }));
    };
    getJWT();
  }, [setTokenServiceClient]);

  // This hook provides list of interactives on a given page and saving of the linked interactive IDs.
  const [schemaWithInteractives, uiSchemaWithInteractives] = useLinkedInteractivesAuthoring({ linkedInteractiveProps, schema, uiSchema });

  return (
    <div className={css.authoring}>
      <Form
        ref={formRef}
        validator={validator}
        schema={schemaWithInteractives}
        uiSchema={uiSchemaWithInteractives}
        widgets={widgets}
        formData={authoredState}
        onChange={onChange}
        fields={fields}
        customValidate={validate}
        formContext={{
          // Pass authored state in context, so custom field can access the complete authored state.
          // It's useful quite often, e.g. when field rendering is based on previous form inputs.
          // Currently used by drag and drop - `initialState` field is using list of draggable items.
          authoredState: authoredState || {},
          tokenServiceClient
        }}
      >
        {/* Children are used to render custom action buttons. We don't want any, */}
        {/* as form is saving and validating data live. */}
        <span />
      </Form>
    </div>
  );
};
