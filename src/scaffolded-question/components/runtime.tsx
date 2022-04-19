import React from "react";
import { IframeRuntime } from "../../shared/components/iframe-runtime";
import { IInteractiveState, IAuthoredState } from "./types";
import { SubmitButton } from "../../shared/components/submit-button";
import { LockedInfo } from "../../shared/components/locked-info";
import { useStudentSettings } from "../../shared/hooks/use-student-settings";
import { renderHTML } from "../../shared/utilities/render-html";
import { log } from "@concord-consortium/lara-interactive-api";
import { libraryInteractiveIdToUrl } from "../../shared/utilities/library-interactives";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const decorateOptions = useGlossaryDecoration();
  const studentSettings = useStudentSettings();
  // 1 means that student get to the easiest question variant. 5 means that user is limited to the most difficult
  // one (assuming there are 5 levels in total).
  const minAllowedLevel = studentSettings?.scaffoldedQuestionLevel || 1;

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
      log("scaffolded question hint used", { current_level: currentLevel, new_level: currentLevel - 1,  });
    }
  };
  const subinteractiveUrl = libraryInteractiveIdToUrl(currentInteractive.libraryInteractiveId, "scaffolded-question");
  const logRequestData: Record<string, unknown> =
                                                  { subinteractive_url: subinteractiveUrl,
                                                    subinteractive_type: currentInteractive.authoredState.questionType,
                                                    subinteractive_sub_type: currentInteractive.authoredState.questionSubType,
                                                    subinteractive_id: currentInteractive.id,
                                                    scaffolded_question_level: currentLevel
                                                  };

  return (
    <div className={css.runtime} tabIndex={1}>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <div>{renderHTML(authoredState.prompt)}</div>
        </DecorateChildren> }
      <IframeRuntime
        key={currentInteractive.id}
        id={currentInteractive.id}
        url={subinteractiveUrl}
        authoredState={currentInteractive.authoredState}
        interactiveState={subState}
        setInteractiveState={readOnly ? undefined : handleNewInteractiveState.bind(null, currentInteractive.id)}
        report={readOnly}
        logRequestData={logRequestData}
        onUnloadCallback={readOnly ? undefined : handleNewInteractiveState.bind(null, currentInteractive.id)}
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
