import { getURLParam } from "@concord-consortium/question-interactives-helpers/src/utilities/get-url-param";

const drawingToolDialogUrlParam = "drawingToolDialog";

export const hasDrawingToolDialogUrlParam = () => !!getURLParam(drawingToolDialogUrlParam);

export const urlWithDrawingToolDialogUrlParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.append(drawingToolDialogUrlParam, "true");
  return url.toString();
};

