import { FormValidation } from "@rjsf/utils";
import { IAuthoredState } from "./types";

const isMissingDataSource = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value !== "string") {
    return true;
  }
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "none";
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const customValidate = (
  formData: IAuthoredState,
  errors: FormValidation
): FormValidation => {
  if (isMissingDataSource(formData.dataSourceInteractive)) {
    errors.dataSourceInteractive?.addError("Please choose a data source interactive.");
  }

  if (formData.xAxisMax !== undefined && (!isFiniteNumber(formData.xAxisMax) || formData.xAxisMax <= 0)) {
    errors.xAxisMax?.addError("Must be a positive number.");
  }

  if (formData.chartHeight !== undefined && (!isFiniteNumber(formData.chartHeight) || formData.chartHeight <= 0)) {
    errors.chartHeight?.addError("Must be a positive number.");
  }

  if (formData.yAxisRangeMode === "fixed") {
    const { yMin, yMax } = formData;

    if (yMin !== undefined && !isFiniteNumber(yMin)) {
      errors.yMin?.addError("Must be a finite number.");
    }
    if (yMax !== undefined && !isFiniteNumber(yMax)) {
      errors.yMax?.addError("Must be a finite number.");
    }

    if (isFiniteNumber(yMin) && isFiniteNumber(yMax) && yMin >= yMax) {
      errors.yMax?.addError("Y-axis max must be greater than Y-axis min.");
    }
  }

  return errors;
};
