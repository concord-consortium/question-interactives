import React from "react";
import { IAuthoredState, IChoice, IInteractiveState } from "./app";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
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
    let newChoices: string[];
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
    setInteractiveState?.(prevState => ({...prevState, answerType: "multiple_choice_answer", selectedChoiceIds: newChoices }));
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

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  return (
    <div>
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
                  onChange={readOnly ? undefined : handleChange.bind(null, choice.id)}
                  readOnly={readOnly}
                  disabled={readOnly}
                /> {choice.content}
              </div>
            );
          })
        }
      </div>
    </div>
  );
};
