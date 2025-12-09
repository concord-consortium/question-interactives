import React from "react";
import classNames from "classnames";

import { formatValue } from "../utils/format-utils";

import css from "./slider-readout.scss";

interface IProps {
  formatType?: string;
  isCompletedRecording?: boolean;
  inRecordingMode?: boolean;
  isRecording?: boolean;
  max: number;
  min: number;
  precision?: number;
  step?: number;
  unit?: string;
  value: number;
  onChange: (newValue: number) => void;
}

const MAX_INPUT_WIDTH_CH = 8;

// Determines input width based on the maximum possible formatted value length.
const calculateInputWidth = (min: number, max: number, currentValue: number, formatType: string, precision?: number): number => {
  const breathingRoom = formatType === "integer" ? 1 : 0;
  const formattedMin = formatValue(min, formatType, precision);
  const formattedMax = formatValue(max, formatType, precision);
  const formattedCurrent = formatValue(currentValue, formatType, precision);
  const maxLength = Math.max(
    formattedMin.length,
    formattedMax.length,
    formattedCurrent.length
  );

  return Math.min(maxLength + breathingRoom, MAX_INPUT_WIDTH_CH);
};

export const SliderReadout: React.FC<IProps> = (props) => {
  const { formatType = "integer", isCompletedRecording, inRecordingMode, isRecording, min, max, onChange, precision, step, unit: _unit, value } = props;
  const formattedValue = formatValue(value, formatType, precision);
  const unit = formatType === "percent" ? "%" : (_unit ?? "");
  const inputWidth = calculateInputWidth(min, max, value, formatType, precision);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording || isCompletedRecording) return;

    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Return") {
      e.currentTarget.blur();
    }
  };

  const containerClasses = classNames(
    css.valueContainer,
    {
      [css.completedRecording]: isCompletedRecording,
      [css.recording]: isRecording,
      [css.inRecordingMode]: inRecordingMode
    }
  );

  return (
    <div className={containerClasses} data-testid="slider-widget-value-container">
      <input
        className={css.valueInput}
        data-testid="slider-widget-input"
        disabled={isRecording || isCompletedRecording}
        min={min}
        max={max}
        step={step}
        style={{ width: `${inputWidth}ch` }}
        type="number"
        value={formattedValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
      />
      {unit && <span className={css.unit} data-testid="slider-widget-unit">{unit}</span>}
    </div>
  );
};
