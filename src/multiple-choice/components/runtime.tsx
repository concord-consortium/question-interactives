import React from "react";
import { v4 as uuidv4 } from "uuid";
import { IAuthoredState, IChoice, IInteractiveState } from "./app";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

const baseElementId = uuidv4();     // DOM id necessary to associate inputs and label-for

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const type = authoredState.multipleAnswers ? "checkbox" : "radio";
  let selectedChoiceIds = interactiveState?.selectedChoiceIds || [];
  if (!authoredState.multipleAnswers && selectedChoiceIds.length > 1) {
    // This can happen when author changes type of the question, but student provided some answers before.
    // Don't let multiple radio inputs be selected, as that basically breaks their behavior and event handling.
    // Clear previous answer instead.
    selectedChoiceIds = [];
  }

  const handleRadioCheckChange = (choiceId: string, event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newChoice = [ event.target.value ];
    setInteractiveState?.(prevState => ({...prevState, answerType: "multiple_choice_answer", selectedChoiceIds: newChoice }));
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

  const renderRadioChecks = () => {
    return authoredState.choices && authoredState.choices.map(choice => {
      const checked = selectedChoiceIds.indexOf(choice.id) !== -1;
      const inputId = baseElementId + choice.id;
      return (
        <div key={choice.id} className={getChoiceClass(choice, checked)}>
          <input
            type={type}
            value={choice.id}
            id={inputId}
            name="answer"
            checked={checked}
            onChange={readOnly ? undefined : handleRadioCheckChange.bind(null, choice.id)}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <label htmlFor={inputId}>
            {choice.content}
          </label>
        </div>
      );
    });
  }

  const renderSelect = () => {
    return (
      <select value={selectedChoiceIds[0] || "placeholder"} onChange={handleSelectChange} disabled={readOnly}>
        <option value="placeholder" disabled={true}>Select an option</option>
        {
          authoredState.choices && authoredState.choices.map(choice =>
            <option key={choice.id} value={choice.id}>{ choice.content }</option>
          )
        }
      </select>
    );
  }

  const layout = authoredState.layout || "vertical";

  return (
    <fieldset>
      { authoredState.prompt && <legend className={css.prompt + " list-unstyled"}>{ authoredState.prompt }</legend> }
      <div className={css.choices + " " + css[layout]} data-cy="choices-container">
        {
          authoredState.layout !== "dropdown"
          ? renderRadioChecks()
          : renderSelect()
        }
      </div>
    </fieldset>
  );
};
