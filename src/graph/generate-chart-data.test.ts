import { generateChartData } from "./generate-chart-data";
import { IDataset } from "@concord-consortium/lara-interactive-api";
import { IAuthoredState } from "./components/types";

const dataset1: IDataset = {
  type: "dataset",
  version: 1,
  properties: ["x", "y"],
  xAxisProp: "x",
  rows: [ [1, 10], [2, 20] ]
};

const dataset1A: IDataset = {
  type: "dataset",
  version: 1,
  properties: ["x", "y"],
  xAxisProp: "x",
  rows: [ [1.5, 100], [2, 200], [3, 300] ]
};

const dataset2: IDataset = {
  type: "dataset",
  version: 1,
  properties: ["x", "y2"],
  xAxisProp: "x",
  rows: [ [7, null], [8, 2000] ]
};

const datasetWithoutXProp: IDataset = {
  type: "dataset",
  version: 1,
  properties: ["y"],
  rows: [ [100], [200] ]
};

const authoredState: IAuthoredState = {
  version: 1,
};

describe("generateChartData", () => {
  it("works for a single dataset", () => {
    const result = generateChartData([dataset1], [], authoredState);
    expect(result[0].labels).toEqual([1, 2]);
    expect(result[0].datasets[0]).toMatchObject({
      label: "y",
      data: [10, 20],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
  });

  it("works for multiple datasets", () => {
    const result = generateChartData([dataset1, dataset2], [], authoredState);
    expect(result[0].labels).toEqual([1, 2]);
    expect(result[0].datasets[0]).toMatchObject({
      label: "y",
      data: [10, 20],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });

    expect(result[1].labels).toEqual([7, 8]);
    expect(result[1].datasets[0]).toMatchObject({
      label: "y2",
      data: [null, 2000],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
  });

  it("generates X axis labels (row indices) when xAxisProp is not specified", () => {
    const result = generateChartData([datasetWithoutXProp], [], authoredState);
    expect(result[0].labels).toEqual([1, 2]);
    expect(result[0].datasets[0]).toMatchObject({
      label: "y",
      data: [100, 200],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
  });

  it("hides labels when not requested by authoring", () => {
    const result = generateChartData([datasetWithoutXProp], [], authoredState);
    expect(result[0].labels).toEqual([1, 2]);
    expect(result[0].datasets[0]).toMatchObject({
      datalabels: {
        align: 'end',
        anchor: 'end',
        display: false
      }
    });
  });

  it("shows labels when requested by authoring", () => {
    const displayBarValuesAuthoredState: IAuthoredState = {
      version: 1,
      displayBarValues: true
    };
    const result = generateChartData([datasetWithoutXProp], [], displayBarValuesAuthoredState);
    expect(result[0].labels).toEqual([1, 2]);
    expect(result[0].datasets[0]).toMatchObject({
      datalabels: {
        align: 'end',
        anchor: 'end',
        display: true
      }
    });
  });

  it("merges multiple datasets when possible and provides index labels automatically", () => {
    const result = generateChartData([dataset1, dataset1A], [], authoredState);
    expect(result[0].labels).toEqual([1, 2, 1.5, 3]);
    expect(result[0].datasets[0]).toMatchObject({
      label: "y #1",
      data: [10, 20],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
    expect(result[0].datasets[1]).toMatchObject({
      label: "y #2",
      data: [null, 200, 100, 300],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
  });

  it("merges multiple datasets when possible and uses provided dataset names", () => {
    const result = generateChartData([dataset1, dataset1A], ["Data Source 1", "Data Source 2"], authoredState);
    expect(result[0].labels).toEqual([1, 2, 1.5, 3]);
    expect(result[0].datasets[0]).toMatchObject({
      label: "y - Data Source 1",
      data: [10, 20],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
    expect(result[0].datasets[1]).toMatchObject({
      label: "y - Data Source 2",
      data: [null, 200, 100, 300],
      backgroundColor: expect.any(String),
      borderColor: expect.any(String),
      borderWidth: expect.any(Number)
    });
  });
});
