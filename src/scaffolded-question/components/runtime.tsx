import React from "react";
import { IAuthoredState } from "./authoring";
import { IframeRuntime } from "./iframe-runtime";
import css from "./runtime.scss";
import { useRequiredQuestion } from "../../shared/hooks/use-required-question";

export interface IInteractiveState {
  subinteractiveStates: {
    [id: string]: any;
  },
  currentSubinteractiveId: string;
  submitted: boolean;
}

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, setNavigation, report }) => {
  const currentSubintId = interactiveState?.currentSubinteractiveId;
  let currentInteractive = authoredState.subinteractives.find(si => si.id === currentSubintId);
  if (!currentInteractive) {
    currentInteractive = authoredState.subinteractives[0];
  }

  const currentSubintIndex = authoredState.subinteractives.indexOf(currentInteractive);

  const subStates = interactiveState?.subinteractiveStates;
  const subState = subStates && subStates[currentInteractive.id]

  const submitted = interactiveState?.submitted;
  const hintAvailable = !submitted && (currentSubintIndex < authoredState.subinteractives.length - 1);

  // User can submit answer only if any answer has been provided before.
  const submitEnabled = !!subState;

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  const { submitButton, lockedInfo } = useRequiredQuestion({ authoredState, interactiveState, setInteractiveState, setNavigation, submitEnabled });

  const handleNewInteractiveState = (interactiveId: string, newInteractiveState: any) => {
    if (setInteractiveState) {
      const updatedStates = Object.assign({}, interactiveState?.subinteractiveStates, { [interactiveId]: newInteractiveState  });
      setInteractiveState(Object.assign({}, interactiveState, { subinteractiveStates: updatedStates }));
    }
  };

  const handleHint = () => {
    if (setInteractiveState && currentSubintIndex < authoredState.subinteractives.length - 1) {
      const newInteractive = authoredState.subinteractives[currentSubintIndex + 1];
      setInteractiveState(Object.assign({}, interactiveState, { currentSubinteractiveId: newInteractive.id }));
    }
  };

  if (authoredState.subinteractives.length === 0) {
    return <div>"No subquestions available. Please add them using authoring interface."</div>;
  }

  return (
    <div className={css.runtime}>
      { authoredState.prompt && <div>{ authoredState.prompt }</div> }
      <IframeRuntime
        key={currentInteractive.id}
        url={currentInteractive.url}
        authoredState={currentInteractive.authoredState}
        interactiveState={subState}
        setInteractiveState={readOnly ? undefined : handleNewInteractiveState.bind(null, currentInteractive.id)}
        report={readOnly}
      />
      {
        authoredState.extraInstructions &&
        <div className={css.extraInstructions}>{ authoredState.extraInstructions }</div>
      }
      {
        !report &&
        <div className={css.buttons}>
          { hintAvailable && <button onClick={handleHint}>Hint</button> }
          { submitButton }
        </div>
      }
      { !report && lockedInfo }
      {
        report &&
        <div>
          <div>Hint has been used { currentSubintIndex } times.</div>
          { authoredState.required && <div>Question has been { submitted ? "" : "not" } submitted.</div> }
        </div>
      }
    </div>
  );
};
