import React, { useEffect, useMemo, useRef, useState } from "react";
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
const DEBOUNCE_DELAY_MS = 750;

// Determines input width based on the maximum possible formatted value length.
const calculateInputWidth = (min: number, max: number, currentValue: number, formatType: string, precision?: number): number => {
  const formattedMin = formatValue(min, formatType, precision);
  const formattedMax = formatValue(max, formatType, precision);
  const formattedCurrent = formatValue(currentValue, formatType, precision);
  const maxLength = Math.max(
    formattedMin.length,
    formattedMax.length,
    formattedCurrent.length
  );

  // Integer values need an extra 1ch to prevent visual cropping, while decimal and percent values
  // render correctly without it.
  const widthCorrection = formatType === "integer" ? 1 : 0;

  return Math.min(maxLength + widthCorrection, MAX_INPUT_WIDTH_CH);
};

export const SliderReadout: React.FC<IProps> = (props) => {
  const { formatType = "integer", isCompletedRecording, inRecordingMode, isRecording, min, max, onChange, precision, step, unit: _unit, value } = props;
  const unit = formatType === "percent" ? "%" : (_unit ?? "");
  
  const formattedValue = useMemo(() => {
    return formatValue(value, formatType, precision);
  }, [value, formatType, precision]);

  const [localValue, setLocalValue] = useState(formattedValue);
  const [isEditing, setIsEditing] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value with external value when not actively editing.
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(formattedValue);
    }
  }, [formattedValue, isEditing]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  const inputWidth = useMemo(() => {
    return calculateInputWidth(min, max, value, formatType, precision);
  }, [min, max, value, formatType, precision]);

  // Commits the value and returns the clamped result
  const commitValue = (valueToCommit: string): string | null => {
    const parsed = parseFloat(valueToCommit);
    if (!isNaN(parsed)) {
      onChange(parsed);
      const clampedValue = Math.max(min, Math.min(max, parsed));
      return formatValue(clampedValue, formatType, precision);
    }
    return null;
  };

  const handleInputFocus = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording || isCompletedRecording) return;

    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the commit to allow natural typing.
    // After committing, update localValue to the clamped value.
    debounceTimerRef.current = setTimeout(() => {
      const clampedFormatted = commitValue(newValue);
      if (clampedFormatted !== null) {
        setLocalValue(clampedFormatted);
      }
    }, DEBOUNCE_DELAY_MS);
  };

  const handleInputBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    commitValue(localValue);
    setIsEditing(false);
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
        value={localValue}
        onBlur={handleInputBlur}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
      />
      {unit && <span className={css.unit} data-testid="slider-widget-unit">{unit}</span>}
    </div>
  );
};
