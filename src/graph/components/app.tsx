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
      graphsPerRow: {
        title: "Number of graphs per row",
        type: "number",
        enum: [1, 2, 3, 4],
        default: 3
      },
      dataSourceInteractive1: {
        title: "Data Source Interactive 1",
        type: "string",
        enum: [],
        enumNames: []
      }
    },
    // Why this strange chain of dependencies?
    // Theoretically we could use dataSourceInteractive.type === "array", as react-jsonschema-forms handles that nicely.
    // But it would make handling of linked interactives difficult. Our hooks / helpers support only top-level
    // linked interactive properties in the authored state. That way authored state will remain "flat", having just:
    // .dataSourceInteractive1, ..., .dataSourceInteractive3 properties instead of an array.
    dependencies: {
      dataSourceInteractive1: {
        properties: {
          dataSourceInteractive2: {
            title: "Data Source Interactive 2",
            type: "string",
            enum: [],
            enumNames: []
          }
        }
      },
      dataSourceInteractive2: {
        properties: {
          dataSourceInteractive3: {
            title: "Data Source Interactive 3",
            type: "string",
            enum: [],
            enumNames: []
          }
        }
      }
    }
  } as JSONSchema6,

  uiSchema: {
    version: {
      "ui:widget": "hidden"
    },
    graphsPerRow: {
      "ui:widget": "radio",
      "ui:options": {
        "inline": true
      }
    }
  }
};

export const App = () => (
  <BaseApp<IAuthoredState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    disableAutoHeight={false}
    linkedInteractiveProps={[
      { label: "dataSourceInteractive1" }, { label: "dataSourceInteractive2" }, { label: "dataSourceInteractive3" }
    ]}
  />
);
