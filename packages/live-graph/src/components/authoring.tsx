import React, { useRef } from "react";
import Form, { IChangeEvent } from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { IAuthoringComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { useLinkedInteractivesAuthoring } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactives-authoring";
import { ILinkedInteractiveProp } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactives-authoring";
import { useDelayedValidation } from "@concord-consortium/question-interactives-helpers/src/hooks/use-delayed-validation";
import { IAuthoredState } from "./types";
import { baseAuthoringProps } from "./authoring-config";

import "@concord-consortium/question-interactives-helpers/src/styles/bootstrap-3.3.7.scss";
import css from "@concord-consortium/question-interactives-helpers/src/styles/authoring.scss";

const linkedInteractiveProps: ILinkedInteractiveProp[] = [{ label: "dataSourceInteractive" }];

export const getUiSchema = (authoredState: IAuthoredState | null) => {
  const isFixed = authoredState?.yAxisRangeMode === "fixed";
  const isAllow = authoredState?.columnFilteringMode === "allow";
  const isIgnore = authoredState?.columnFilteringMode === "ignore";

  return {
    ...baseAuthoringProps.uiSchema,
    yMin: {
      "ui:disabled": !isFixed,
    },
    yMax: {
      "ui:disabled": !isFixed,
    },
    allowList: {
      ...baseAuthoringProps.uiSchema.allowList,
      "ui:disabled": !isAllow,
    },
    ignoreList: {
      ...baseAuthoringProps.uiSchema.ignoreList,
      "ui:disabled": !isIgnore,
    },
  };
};

export const Authoring: React.FC<IAuthoringComponentProps<IAuthoredState>> = ({
  authoredState,
  setAuthoredState,
}) => {
  const formRef = useRef<Form<IAuthoredState>>(null);
  const triggerDelayedValidation = useDelayedValidation({ formRef });

  const uiSchema = getUiSchema(authoredState);
  const [schemaWithInteractives, uiSchemaWithInteractives] = useLinkedInteractivesAuthoring({
    linkedInteractiveProps,
    schema: baseAuthoringProps.schema,
    uiSchema,
  });

  const handleChange = (event: IChangeEvent) => {
    let formData = event.formData;
    if (baseAuthoringProps.preprocessFormData) {
      formData = baseAuthoringProps.preprocessFormData(formData);
    }
    if (setAuthoredState) {
      setAuthoredState(() => formData);
    }
    triggerDelayedValidation();
  };

  return (
    <div className={css.authoring}>
      <Form
        ref={formRef}
        validator={validator}
        schema={schemaWithInteractives}
        uiSchema={uiSchemaWithInteractives}
        formData={authoredState}
        onChange={handleChange}
        customValidate={baseAuthoringProps.validate}
      >
        <div />
      </Form>
    </div>
  );
};
