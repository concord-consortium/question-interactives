import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IAuthoredState, IInteractiveState } from "../types";
import { StaticDrawing } from "./static-drawing";

export const getReportItemHtml = ({ interactiveState }: { interactiveState: IInteractiveState; authoredState: IAuthoredState; }) => {
  if (!interactiveState.drawingState) return "";

  const staticMarkup = renderToStaticMarkup(
    <StaticDrawing drawingState={interactiveState.drawingState} />
  );

  return `
    <style>
      .tall {
        max-width: 378px;
      }
      .wide {
        max-width: 100px;
      }
    </style>
    <div class="tall">
      ${staticMarkup}
    </div>
    <div class="wide">
      ${staticMarkup}
    </div>
  `;
};
