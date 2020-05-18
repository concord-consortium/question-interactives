import React from "react";
import { IAuthoredState, IChoice } from "./authoring";
import css from "./runtime.scss";

interface IInteractiveState {
  selectedChoiceIds: string[];
}

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const type = authoredState.multipleAnswers ? "checkbox" : "radio";
  let selectedChoiceIds = interactiveState?.selectedChoiceIds || [];
  if (!authoredState.multipleAnswers && selectedChoiceIds.length > 1) {
    // This can happen when author changes type of the question, but student provided some answers before.
    // Don't let multiple radio inputs be selected, as that basically breaks their behavior and event handling.
    // Clear previous answer instead.
    selectedChoiceIds = [];
  }

  const handleChange = (choiceId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    let newChoices;
    if (!authoredState.multipleAnswers) {
      // Radio buttons, just one answer.
      newChoices = [ choiceId ];
    } else {
      // Checkboxes, multiple answers allowed.
      newChoices = interactiveState?.selectedChoiceIds.slice() || [];
      const currentIdx = newChoices.indexOf(choiceId);
      if (checked && currentIdx === -1) {
        newChoices.push(choiceId);
      }
      if (!checked && currentIdx !== -1) {
        newChoices.splice(currentIdx, 1);
      }
    }
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { selectedChoiceIds: newChoices }));
    }
  };

  const getChoiceClass = (choice: IChoice, checked: boolean) => {
    if (!report) {
      return undefined;
    }
    // Question is scored if it has at least one correct answer defined.
    const questionScored = !!authoredState.choices && authoredState.choices.filter(c => c.correct).length > 0;
    if (!questionScored) {
      return undefined;
    }
    if (checked && choice.correct) {
      return css.correctChoice;
    }
    if (!checked && choice.correct) {
      // User didn't check correct answer. Mark it.
      return css.incorrectChoice;
    }
  };

  return (
    <div className={css.runtime}>
      { authoredState.prompt && <div>{ authoredState.prompt }</div> }
      <div>
        {
          authoredState.choices && authoredState.choices.map(choice => {
            const checked = selectedChoiceIds.indexOf(choice.id) !== -1;
            return (
              <div key={choice.id} className={getChoiceClass(choice, checked)}>
                <input
                  type={type}
                  value={choice.id}
                  name="answer"
                  checked={checked}
                  onChange={report ? undefined : handleChange.bind(null, choice.id)}
                  readOnly={report}
                  disabled={report}
                /> {choice.content}
              </div>
            );
          })
        }
      </div>
      {
        authoredState.extraInstructions &&
        <div className={css.extraInstructions}>{ authoredState.extraInstructions }</div>
      }
    </div>
  );
};
