import React, { useEffect, useRef, useState } from "react";
import Form, { Field, FormValidation, IChangeEvent, UiSchema } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";
import { useDelayedValidation } from "../hooks/use-delayed-validation";
import { RichTextWidget } from "../widgets/rich-text/rich-text-widget";
import { ImageUploadWidget } from "../widgets/image-upload/image-upload-widget";
import { ILinkedInteractiveProp, useLinkedInteractivesAuthoring } from "../hooks/use-linked-interactives-authoring";
import "../../shared/styles/boostrap-3.3.7.css"; // necessary to style react-jsonschema-form
import { getFirebaseJwt } from "@concord-consortium/lara-interactive-api";
import { TokenServiceClient } from "@concord-consortium/token-service";

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
  tokenServiceClient: TokenServiceClient;
}

// custom widgets
const widgets = {
  richtext: RichTextWidget,
  imageUpload: ImageUploadWidget
};

export const getTokenServiceEnv = () => {
  // use either the portal url param for standalone authoring or the Lara page url for inline authoring
  // Note that when local Portal is being used, we'll still return "staging" token service env, so developers don't
  // have to setup local instance of token service. When local token service client should be used, you need to use
  // `token-service-url=dev` URL param. It's handled by TokenServiceClient directly, and the `env` param passed to its
  // constructor will be ignored.
  let env = "staging";
  const host = window.location.hostname;
  if (!host.match(/staging\./) && host.match(/concord\.org/)) {
    env = "production";
  }
  console.log("getTokenServiceEnv", {host, env});
  return env;
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
      setTokenServiceClient(new TokenServiceClient({ jwt: jwt.token, env: getTokenServiceEnv() }));
    };
    getJWT();
  }, [setTokenServiceClient]);

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
