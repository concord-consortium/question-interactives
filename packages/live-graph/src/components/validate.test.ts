import { customValidate } from "./validate";
import { IAuthoredState } from "./types";

const makeErrors = () => {
  const dataSource = { addError: jest.fn(), __errors: [] as string[] };
  const xAxisMax = { addError: jest.fn(), __errors: [] as string[] };
  const yMin = { addError: jest.fn(), __errors: [] as string[] };
  const yMax = { addError: jest.fn(), __errors: [] as string[] };
  const errors: any = {
    dataSourceInteractive: dataSource,
    xAxisMax,
    yMin,
    yMax,
    addError: jest.fn(),
  };
  return { errors, dataSource, xAxisMax, yMin, yMax };
};

const baseState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  dataSourceInteractive: "interactive_15911",
};

describe("customValidate - dataSourceInteractive", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["empty string", ""],
    ["whitespace-only string", "   "],
    ['"none" sentinel', "none"],
  ])("flags missing dataSourceInteractive when %s", (_label, value) => {
    const { errors, dataSource } = makeErrors();
    customValidate({ ...baseState, dataSourceInteractive: value as any }, errors);
    expect(dataSource.addError).toHaveBeenCalledWith(
      "Please choose a data source interactive."
    );
  });

  it("accepts a real interactive id", () => {
    const { errors, dataSource } = makeErrors();
    customValidate({ ...baseState, dataSourceInteractive: "interactive_42" }, errors);
    expect(dataSource.addError).not.toHaveBeenCalled();
  });
});

describe("customValidate - xAxisMax", () => {
  it("accepts a positive xAxisMax", () => {
    const { errors, xAxisMax } = makeErrors();
    customValidate({ ...baseState, xAxisMax: 50 }, errors);
    expect(xAxisMax.addError).not.toHaveBeenCalled();
  });

  it("accepts undefined xAxisMax", () => {
    const { errors, xAxisMax } = makeErrors();
    customValidate({ ...baseState }, errors);
    expect(xAxisMax.addError).not.toHaveBeenCalled();
  });

  it("flags xAxisMax of 0 as non-positive", () => {
    const { errors, xAxisMax } = makeErrors();
    customValidate({ ...baseState, xAxisMax: 0 }, errors);
    expect(xAxisMax.addError).toHaveBeenCalledWith("Must be a positive number.");
  });

  it("flags negative xAxisMax", () => {
    const { errors, xAxisMax } = makeErrors();
    customValidate({ ...baseState, xAxisMax: -5 }, errors);
    expect(xAxisMax.addError).toHaveBeenCalledWith("Must be a positive number.");
  });

  it("flags NaN xAxisMax", () => {
    const { errors, xAxisMax } = makeErrors();
    customValidate({ ...baseState, xAxisMax: NaN }, errors);
    expect(xAxisMax.addError).toHaveBeenCalledWith("Must be a positive number.");
  });
});

describe("customValidate - Y-axis range (auto mode)", () => {
  it("does not check yMin/yMax in auto mode", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "auto", yMin: 100, yMax: 0 },
      errors
    );
    expect(yMin.addError).not.toHaveBeenCalled();
    expect(yMax.addError).not.toHaveBeenCalled();
  });
});

describe("customValidate - Y-axis range (fixed mode)", () => {
  it("passes when yMin < yMax", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMin: 0, yMax: 10 },
      errors
    );
    expect(yMin.addError).not.toHaveBeenCalled();
    expect(yMax.addError).not.toHaveBeenCalled();
  });

  it("flags equal min/max with 'must be greater' message", () => {
    const { errors, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMin: 5, yMax: 5 },
      errors
    );
    expect(yMax.addError).toHaveBeenCalledWith(
      "Y-axis max must be greater than Y-axis min."
    );
  });

  it("flags inverted min/max with 'must be greater' message", () => {
    const { errors, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMin: 10, yMax: 0 },
      errors
    );
    expect(yMax.addError).toHaveBeenCalledWith(
      "Y-axis max must be greater than Y-axis min."
    );
  });

  it("short-circuits when yMin is set and yMax is undefined", () => {
    const { errors, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMin: 0 },
      errors
    );
    expect(yMax.addError).not.toHaveBeenCalled();
  });

  it("short-circuits when yMax is set and yMin is undefined", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMax: 10 },
      errors
    );
    expect(yMin.addError).not.toHaveBeenCalled();
    expect(yMax.addError).not.toHaveBeenCalled();
  });

  it("short-circuits when both yMin and yMax are undefined", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate({ ...baseState, yAxisRangeMode: "fixed" }, errors);
    expect(yMin.addError).not.toHaveBeenCalled();
    expect(yMax.addError).not.toHaveBeenCalled();
  });

  it("flags NaN yMin as non-finite without cross-field error", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMin: NaN, yMax: 10 },
      errors
    );
    expect(yMin.addError).toHaveBeenCalledWith("Must be a finite number.");
    expect(yMax.addError).not.toHaveBeenCalled();
  });

  it("flags Infinity yMax as non-finite without cross-field error", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate(
      { ...baseState, yAxisRangeMode: "fixed", yMin: 0, yMax: Infinity },
      errors
    );
    expect(yMin.addError).not.toHaveBeenCalled();
    expect(yMax.addError).toHaveBeenCalledWith("Must be a finite number.");
    expect(yMax.addError).not.toHaveBeenCalledWith(
      "Y-axis max must be greater than Y-axis min."
    );
  });

  it("flags both as non-finite when both are infinite without cross-field error", () => {
    const { errors, yMin, yMax } = makeErrors();
    customValidate(
      {
        ...baseState,
        yAxisRangeMode: "fixed",
        yMin: -Infinity,
        yMax: Infinity,
      },
      errors
    );
    expect(yMin.addError).toHaveBeenCalledWith("Must be a finite number.");
    expect(yMax.addError).toHaveBeenCalledWith("Must be a finite number.");
    expect(yMax.addError).not.toHaveBeenCalledWith(
      "Y-axis max must be greater than Y-axis min."
    );
  });

  it("flags a string-typed yMin as non-finite", () => {
    const { errors, yMin } = makeErrors();
    customValidate(
      {
        ...baseState,
        yAxisRangeMode: "fixed",
        yMin: "abc" as any,
        yMax: 10,
      },
      errors
    );
    expect(yMin.addError).toHaveBeenCalledWith("Must be a finite number.");
  });
});
