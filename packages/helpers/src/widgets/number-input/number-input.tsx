import React, { useCallback, useState } from "react";
import { WidgetProps } from "@rjsf/utils";

export const NumberInputWidget = (props: WidgetProps) => {
  const [value, setValue] = useState<number|string>(props.value);
  const noNegativeNumbers = props.schema.minimum !== undefined && props.schema.minimum >= 0;

  const onChange = useCallback((newValue: any) => {
    setValue(newValue);
    props.onChange(newValue);
  }, [props]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // don't allow negative numbers if minimum is 0
    if ((e.key === "-") && noNegativeNumbers) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (props.schema.minimum !== undefined) {
      const newValue = parseFloat(e.target.value);
      if (newValue < props.schema.minimum) {
        e.preventDefault();
        return;
      }
    }
    onChange(e.target.value);
  };

  const handleBlur = useCallback(() => {
    if (String(value).trim().length === 0) {
      const defaultValue = props.schema.default === undefined ? "0" : props.schema.default as string;
      onChange(defaultValue);
    }
  }, [value, props, onChange]);

  return (
    <input
      className="form-control"
      id={props.id}
      type="number"
      step={1}
      min={props.schema.minimum}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onBlurCapture={handleBlur}
    />
  );
};
