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
      displayXAxisLabels: {
        title: "Display X axis labels",
        type: "boolean",
        default: true
      },
      autoscaleYAxis: {
        title: "Autoscale Y axis",
        type: "boolean",
        default: true
      },
      displayBarValues: {
        title: "Display values on bars",
        type: "boolean",
        default: false
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
          dataSourceInteractive1Name: {
            title: "Data Source Interactive 1 Name",
            type: "string"
          },
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
          dataSourceInteractive2Name: {
            title: "Data Source Interactive 2 Name",
            type: "string"
          },
          dataSourceInteractive3: {
            title: "Data Source Interactive 3",
            type: "string",
            enum: [],
            enumNames: []
          }
        }
      },
      dataSourceInteractive3: {
        properties: {
          dataSourceInteractive3Name: {
            title: "Data Source Interactive 3 Name",
            type: "string"
          }
        }
      },
      autoscaleYAxis: {
        oneOf: [
          {
            properties: {
              autoscaleYAxis: {
                const: true
              }
            }
          },
          {
            properties: {
              autoscaleYAxis: {
                const: false
              },
              yAxisMax: {
                title: "Y-Axis max",
                type: "number",
                default: 100
              }
            }
          }
        ]
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
    },
    "ui:order": [
      "graphsPerRow",
      "displayXAxisLabels",
      "autoscaleYAxis",
      "yAxisMax",
      "displayBarValues",
      "*"
    ],
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
