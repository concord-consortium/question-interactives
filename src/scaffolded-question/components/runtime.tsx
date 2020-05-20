import React from "react";
import { IAuthoredState } from "./authoring";
import { IframeRuntime } from "./iframe-runtime";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import css from "./runtime.scss";

interface IInteractiveState {
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
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
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

  const reportOrSubmitted = report || interactiveState?.submitted;

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

  const handleSubmit = () => {
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { submitted: true }));
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
        setInteractiveState={reportOrSubmitted ? undefined : handleNewInteractiveState.bind(null, currentInteractive.id)}
        report={reportOrSubmitted}
      />
      {
        authoredState.extraInstructions &&
        <div className={css.extraInstructions}>{ authoredState.extraInstructions }</div>
      }
      {
        !report &&
        <div className={css.buttons}>
          { hintAvailable && <button onClick={handleHint}>Hint</button> }
          { !submitted && <button onClick={handleSubmit} disabled={submitted}>Submit <FontAwesomeIcon icon={faLock} size="sm" /></button> }
        </div>
      }
      { !report && submitted && <div className={css.locked}>Your answer is now locked. <FontAwesomeIcon icon={faLock} size="sm" /></div> }
      {
        report &&
        <div>
          <div>Hint has been used { currentSubintIndex } times.</div>
          <div>Question has been { submitted ? "" : "not" } submitted.</div>
        </div>
      }
    </div>
  );
};
