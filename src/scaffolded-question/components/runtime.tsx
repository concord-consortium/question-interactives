import React, { useEffect } from "react";
import { IframeRuntime } from "./iframe-runtime";
import { IInteractiveState } from "./app";
import { IAuthoredState } from "./app";
import { SubmitButton } from "../../shared/components/submit-button";
import { LockedInfo } from "../../shared/components/locked-info";
import { useStudentSettings } from "../../shared/hooks/use-student-settings";
import { log } from "@concord-consortium/lara-interactive-api";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const studentSettings = useStudentSettings();
  // 1 means that student get to the easiest question variant. 5 means that user is limited to the most difficult
  // one (assuming there are 5 levels in total).
  const minAllowedLevel = studentSettings?.scaffoldedQuestionLevel || 1;

  const subinteractives = authoredState.subinteractives || [];
  if (subinteractives.length === 0) {
    return <div>"No subquestions available. Please add them using authoring interface."</div>;
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
  const subState = subStates && subStates[currentInteractive.id]

  const submitted = interactiveState?.submitted;
  const hintAvailable = !submitted && (currentLevel - 1 >= minAllowedLevel);

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  // User can submit answer only if any answer has been provided before.
  const isAnswered = !!subState;

  const getAnswerText = (level: number, subinteractiveAnswerText: string | undefined) =>
    `[Level: ${level}] ${subinteractiveAnswerText ? subinteractiveAnswerText : "no response"}`;

  const handleNewInteractiveState = (interactiveId: string, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const updatedStates = {...prevState?.subinteractiveStates, [interactiveId]: newInteractiveState };
      return {
        ...prevState,
        answerType: "interactive_state",
        subinteractiveStates: updatedStates,
        answerText: getAnswerText(currentLevel, newInteractiveState.answerText)
      };
    });
  };

  const handleHint = () => {
    if (currentSubintIndex < subinteractives.length - 1) {
      setInteractiveState?.((prevState: IInteractiveState) => {
        const newInteractive = subinteractives[currentSubintIndex + 1];
        return {
          ...prevState,
          answerType: "interactive_state",
          currentSubinteractiveId: newInteractive.id,
          answerText: getAnswerText(currentLevel - 1, undefined) // new subinteractive state is not available yet
        };
      });
      log("hint used", { current_level: currentLevel, new_level: currentLevel - 1,  });
    }
  };

  return (
    <div className={css.runtime} tabIndex={1}>
      { authoredState.prompt && <div>{ authoredState.prompt }</div> }
      <IframeRuntime
        key={currentInteractive.id}
        id={currentInteractive.id}
        url={currentInteractive.url}
        authoredState={currentInteractive.authoredState}
        interactiveState={subState}
        setInteractiveState={readOnly ? undefined : handleNewInteractiveState.bind(null, currentInteractive.id)}
        scaffoldedQuestionLevel={currentLevel}
        report={readOnly}
      />
      {
        !report &&
        <div className={css.buttons}>
          { hintAvailable && <button onClick={handleHint}>Hint</button> }
          <SubmitButton isAnswered={isAnswered} />
        </div>
      }
      { !report && <LockedInfo /> }
      { report && <div>Hint has been used { currentSubintIndex } times.</div> }
    </div>
  );
};
