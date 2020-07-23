import React from "react";
import { IframeRuntime } from "./iframe-runtime";
import { IInteractiveState } from "./app";
import { IAuthoredState } from "./app";
import { SubmitButton } from "../../shared/components/submit-button";
import { LockedInfo } from "../../shared/components/locked-info";
import { renderHTML } from "../../shared/utilities/render-html";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  const subinteractives = authoredState.subinteractives || [];
  if (subinteractives.length === 0) {
    return <div>No subquestions available. Please add them using authoring interface.</div>;
  }
  const levelsCount = subinteractives.length;

  const currentSubintId = interactiveState?.currentSubinteractiveId;
  let currentInteractive = subinteractives.find(si => si.id === currentSubintId);
  if (!currentInteractive) {
    currentInteractive = subinteractives[0];
  }

  const currentSubintIndex = subinteractives.indexOf(currentInteractive);
  const currentLevel = levelsCount - currentSubintIndex;

  const subStates = interactiveState?.subinteractiveStates;
  const subState = subStates && subStates[currentInteractive.id];

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  // User can submit answer only if any answer has been provided before.
  const isAnswered = !!subState;

  const getAnswerText = (level: number, subinteractiveAnswerText: string | undefined) =>
    `[Level: ${level}] ${subinteractiveAnswerText ? subinteractiveAnswerText : "no response"}`;

  const handleNewInteractiveState = (interactiveId: string, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const updatedStates = { ...prevState?.subinteractiveStates, [interactiveId]: newInteractiveState };
      return {
        ...prevState,
        answerType: "interactive_state",
        subinteractiveStates: updatedStates,
        answerText: getAnswerText(currentLevel, newInteractiveState.answerText)
      };
    });
  };

  const getIframeRuntimes = () => {
    const iframes = [];
    for (let i = 0; i < subinteractives.length; i++) {
      const subInteractive = subinteractives[i];
      const subInteractiveState = subStates && subStates[subInteractive.id];
      iframes.push(
        <IframeRuntime
          key={subInteractive.id}
          id={subInteractive.id}
          url={subInteractive.url}
          authoredState={subInteractive.authoredState}
          interactiveState={subInteractiveState}
          setInteractiveState={readOnly ? undefined : handleNewInteractiveState.bind(null, subInteractive.id)}
          report={readOnly}
        />
      );
    }
    return iframes;
  };

  return (
    <div className={css.runtime} tabIndex={1}>
      { authoredState.prompt &&
        <div>{renderHTML(authoredState.prompt)}</div> }
      { subinteractives.length > 0 && getIframeRuntimes() }
      {
        !report &&
        <div className={css.buttons}>
          <SubmitButton isAnswered={isAnswered} />
        </div>
      }
      { !report && <LockedInfo /> }
    </div>
  );
};
