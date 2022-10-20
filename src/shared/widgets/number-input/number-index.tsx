import React, { useState } from "react";
import { WidgetProps } from "react-jsonschema-form";

export const NumberInputWidget = (props: WidgetProps) => {
  const [value, setValue] = useState<number|string>(props.schema.default === undefined ? "" : props.schema.default as number);
  const noNegativeNumbers = props.schema.minimum !== undefined && props.schema.minimum >= 0;

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
    setValue(e.target.value);
    props.onChange(e.target.value);
  };

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
    />
  );
};
