import React from "react";
import { BaseApp } from "../../shared/components/base-app";
import { IAuthoredState } from "./types";
import { Runtime } from "./runtime";
import { JSONSchema6 } from "json-schema";

const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
      dataSourceInteractive: {
        title: "Data Source Interactive",
        type: "string",
        enum: [],
        enumNames: []
      }
    }
  } as JSONSchema6,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    }
  }
};

export const App = () => (
  <BaseApp<IAuthoredState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    linkedInteractiveProps={[{ label: "dataSourceInteractive" }]}
  />
);
