import React from "react";
import { WidgetProps } from "@rjsf/utils";

export const hideDrawingToolWidgetButtons = ["free", "linesPalette", "shapesPalette", "annotation", "text", "strokeColorPalette", "fillColorPalette", "strokeWidthPalette", "clone", "sendToBack", "sendToFront"] as const;

// remove the annotation tool, as it is only used in the labbook
export const defaultHideDrawingToolWidgetButtons = hideDrawingToolWidgetButtons.filter(b => b !== "annotation");

type HideDrawingToolWidgetButton = typeof hideDrawingToolWidgetButtons[number];
type HideDrawingToolWidgetButtonMap = Record<HideDrawingToolWidgetButton, string>;

const drawingToolWidgetButtonMap: HideDrawingToolWidgetButtonMap = {
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
  const itemValues = (props.schema.items as any).enum as HideDrawingToolWidgetButton[];

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
                <span>{drawingToolWidgetButtonMap[value]}</span>
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
};
