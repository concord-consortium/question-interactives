import React from "react";
import { BaseApp } from "../../shared/components/base-app";
import { JSONSchema6 } from "json-schema";
import { Runtime } from "./runtime";
import { IAuthoredState } from "./types";

export const baseAuthoringProps = {
  schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        default: 1
      },
    }
  } as JSONSchema6,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
  },
};

export const App = () => (
  <BaseApp<IAuthoredState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
  />
);
