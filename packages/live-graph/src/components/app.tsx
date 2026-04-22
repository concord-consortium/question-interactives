import React from "react";
import { RJSFSchema } from "@rjsf/utils";
import { BaseApp } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { IAuthoredState } from "./types";
import { Runtime } from "./runtime";
import { Authoring } from "./authoring";
import { customValidate } from "./validate";

export const baseAuthoringProps = {
  schema: {
    type: "object",
    required: ["dataSourceInteractive"],
    properties: {
      version: {
        type: "number",
        default: 1
      },
      dataSourceInteractive: {
        title: "Data Source Interactive",
        type: "string",
        enum: ["none"],
        enumNames: ["No linked interactives available"]
      },
      chartTitle: {
        title: "Chart title",
        type: "string"
      },
      xAxisColumn: {
        title: "X-axis column",
        type: "string"
      },
      xAxisLabel: {
        title: "X-axis label",
        type: "string"
      },
      xAxisMax: {
        title: "X-axis max",
        type: "number"
      },
      yAxisLabel: {
        title: "Y-axis label",
        type: "string"
      },
      yAxisRangeMode: {
        title: "Y-axis range",
        type: "string",
        enum: ["auto", "fixed"],
        enumNames: ["Auto-scale", "Fixed"],
        default: "auto"
      },
      yMin: {
        title: "Y-axis min",
        type: "number"
      },
      yMax: {
        title: "Y-axis max",
        type: "number"
      },
      columnDisplayNames: {
        title: "Column display names",
        type: "string"
      },
      columnFilteringMode: {
        title: "Column filtering",
        type: "string",
        enum: ["all", "allow", "ignore"],
        enumNames: ["All columns", "Allow list", "Ignore list"],
        default: "all"
      },
      allowList: {
        title: "Allow list",
        type: "string"
      },
      ignoreList: {
        title: "Ignore list",
        type: "string"
      },
      chartHeight: {
        title: "Chart height (px)",
        type: "number",
        default: 400
      },
      noDataMessage: {
        title: "No-data message",
        type: "string"
      },
      noSourceMessage: {
        title: "No-source message",
        type: "string"
      }
    }
  } as RJSFSchema,

  uiSchema: {
    "ui:order": [
      "dataSourceInteractive",
      "chartTitle",
      "xAxisColumn",
      "xAxisLabel",
      "xAxisMax",
      "yAxisLabel",
      "yAxisRangeMode",
      "yMin",
      "yMax",
      "columnDisplayNames",
      "columnFilteringMode",
      "allowList",
      "ignoreList",
      "chartHeight",
      "noDataMessage",
      "noSourceMessage",
      "*"
    ],
    version: {
      "ui:widget": "hidden"
    },
    xAxisColumn: {
      "ui:placeholder": "Enter column name such as 'tick' or 'time'"
    },
    columnDisplayNames: {
      "ui:widget": "textarea",
      "ui:help": "Enter one mapping per line, e.g. pred_count=Predators. Unmapped columns use their raw name. Note: + signs in column names must be written as %2B (URL encoding)."
    },
    allowList: {
      "ui:widget": "textarea",
      "ui:help": "Only these columns will appear. Separate names by commas or newlines."
    },
    ignoreList: {
      "ui:widget": "textarea",
      "ui:help": "These columns will be excluded. Separate names by commas or newlines."
    },
    chartHeight: {
      "ui:help": "Height of the chart in pixels. Defaults to 400."
    },
    noDataMessage: {
      "ui:help": "Shown to students when a data source is linked but no data has arrived yet."
    },
    noSourceMessage: {
      "ui:help": "Shown to students when no data source interactive has been linked to this graph."
    }
  },

  preprocessFormData: (data: IAuthoredState): IAuthoredState => {
    const result = { ...data };
    if (result.yAxisRangeMode !== "fixed") {
      delete result.yMin;
      delete result.yMax;
    }
    if (result.columnFilteringMode !== "allow") {
      delete result.allowList;
    }
    if (result.columnFilteringMode !== "ignore") {
      delete result.ignoreList;
    }
    return result;
  },

  validate: customValidate
};

export const App = () => (
  <BaseApp<IAuthoredState>
    Runtime={Runtime}
    Authoring={Authoring}
    disableAutoHeight={false}
    linkedInteractiveProps={[{ label: "dataSourceInteractive" }]}
  />
);
