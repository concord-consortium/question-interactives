import React from "react";
import { WidgetProps } from "@rjsf/utils";
import { HideableDrawingTools } from "./types";

const hideableDrawingToolLabels: Record<HideableDrawingTools, string> = {
  free: "Free hand drawing tool",
  linesPalette: "Line tool",
  shapesPalette: "Basic shape tool",
  text: "Text tool",
  strokeColorPalette: "Stroke color",
  fillColorPalette: "Fill color",
  strokeWidthPalette: "Stroke Width",
  clone: "Clone tool",
  sendToBack: "Send selected objects to back",
  sendToFront: "Send selected objects to front",
  annotation: "Annotation tool"
};

export const HideDrawingToolsWidget = function (props: WidgetProps) {
  const itemValues = (props.schema.items as any).enum as HideableDrawingTools[];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {value, checked} = e.target;
    const values = props.value.slice() as string[];
    const index = values.indexOf(value);
    if (checked && (index === -1)) {
      props.onChange([...values, value]);
    } else if (!checked && (index !== -1)) {
      values.splice(index, 1);
      props.onChange(values);
    }
  };

  return (
    <div className="checkboxes" id="root_drawingTools">
      <div>{props.schema.hint}</div>
      {itemValues.map((value, index) => {
        const checked = props.value.indexOf(value) !== -1;
        return (
          <div key={value} className="checkbox">
            <label>
              <span>
                <input type="checkbox" id={`root_drawingTools-${index}`} name="root_drawingTools" value={value} checked={checked} onChange={handleChange} />
                <span>{hideableDrawingToolLabels[value]}</span>
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
};
