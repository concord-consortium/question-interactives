export interface IAuthoredState {
  version: number;
  graphsPerRow?: number;
  displayXAxisLabels?: boolean;
  xAxisLabel?: string;
  autoscaleYAxis?: boolean;
  yAxisMax?: number;
  displayBarValues?: boolean;
  // Theoretically we could use dataSourceInteractive.type === "array", as react-jsonschema-forms handles that nicely.
  // But it would make handling of linked interactives difficult. Our hooks / helpers support only top-level
  // linked interactive properties in the authored state. That way authored state can remain "flat", having just:
  // .dataSourceInteractive1, ..., .dataSourceInteractive3 properties instead of an array.
  dataSourceInteractive1?: string;
  dataSourceInteractive2?: string;
  dataSourceInteractive3?: string;

  dataSourceInteractive1Name?: string;
  dataSourceInteractive2Name?: string;
  dataSourceInteractive3Name?: string;
}
