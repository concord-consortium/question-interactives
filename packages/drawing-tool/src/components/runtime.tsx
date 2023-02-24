import React from "react";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useCorsImageErrorCheck } from "@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";

import { IAuthoredState, IInteractiveState } from "./types";
import { UploadBackground } from "./upload-background";
import { TakeSnapshot } from "./take-snapshot";
import { DrawingTool } from "./drawing-tool";

import 'drawing-tool/dist/drawing-tool.css';
import css from "./runtime.scss";

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const decorateOptions = useGlossaryDecoration();
  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));
  const useSnapshot = authoredState?.backgroundSource === "snapshot";
  const useUpload = authoredState?.backgroundSource === "upload";
  const authoredBgCorsError = useCorsImageErrorCheck({
    performTest: authoredState.backgroundSource === "url" && !!authoredState.backgroundImageUrl,
    imgSrc: authoredState.backgroundImageUrl
  });
  if (authoredBgCorsError) {
    return <div className={css.error}>Authored background image is not CORS enabled. Please use a different background
      image URL or change configuration of the host.</div>;
  }
  return (
    <div>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div>
        </DecorateChildren> }
      <DrawingTool authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} readOnly={readOnly} />
      {
        !readOnly && useSnapshot &&
        <TakeSnapshot authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} />
      }
      {
        !readOnly && useUpload &&
        <UploadBackground authoredState={authoredState} setInteractiveState={setInteractiveState} />
      }
    </div>
  );
};
