
import { IAuthoredState, IInteractiveState } from "../types";

export const getReportItemHtml = ({ interactiveState, authoredState }: { interactiveState: IInteractiveState; authoredState: IAuthoredState; }) => {
  return `
  <style>
    .tall {
      flex-direction: row;
    }
  </style>
  <div class="tall">
    TODO: TAIL REPORT ITEM HTML
  </div>
  <div class="wide">
    TODO: WIDE REPORT ITEM HTML
  </div>
  `;
};
