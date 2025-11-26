
import { IAuthoredState, IInteractiveState } from "../types";

export const getReportItemHtml = ({ interactiveState, authoredState }: { interactiveState: IInteractiveState; authoredState: IAuthoredState; }) => {
  return `
  <style>
    .tall {
      flex-direction: row;
    }
  </style>
  <div class="tall">
  </div>
  <div class="wide">
  </div>
  `;
};
