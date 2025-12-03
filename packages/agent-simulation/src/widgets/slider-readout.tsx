import React from "react";
import classNames from "classnames";

import { formatValue } from "../utils/format-utils";

import css from "./slider-readout.scss";

interface IProps {
  formatType?: string;
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

const MAX_INPUT_WIDTH_CH = 5;

export const SliderReadout: React.FC<IProps> = (props) => {
  const { formatType = "integer", inRecordingMode, isRecording, min, max, onChange, precision, step, unit: _unit, value } = props;
  const formattedValue = formatValue(value, formatType, precision);
  const unit = formatType === "percent" ? "%" : (_unit ?? "");
  // Set input width based on max value length to prevent layout shifts.
  const inputWidth = Math.min(max.toString().length + 1, MAX_INPUT_WIDTH_CH);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording) return;

    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
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
      [css.recording]: isRecording,
      [css.inRecordingMode]: inRecordingMode
    }
  );

  return (
    <div className={containerClasses} data-testid="slider-widget-value-container">
      <input
        className={css.valueInput}
        data-testid="slider-widget-input"
        disabled={isRecording}
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
