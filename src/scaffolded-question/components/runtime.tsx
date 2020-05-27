import React from "react";
import { IframeRuntime } from "./iframe-runtime";
import { IInteractiveState } from "./app";
import { IAuthoredState } from "./app";
import { SubmitButton } from "../../shared/components/submit-button";
import { LockedInfo } from "../../shared/components/locked-info";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report, setNavigation }) => {
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

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  // User can submit answer only if any answer has been provided before.
  const isAnswered = !!subState;

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
        !report &&
        <div className={css.buttons}>
          { hintAvailable && <button onClick={handleHint}>Hint</button> }
          <SubmitButton authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} isAnswered={isAnswered} />
        </div>
      }
      { !report && <LockedInfo interactiveState={interactiveState} /> }
      { report && <div>Hint has been used { currentSubintIndex } times.</div> }
    </div>
  );
};
