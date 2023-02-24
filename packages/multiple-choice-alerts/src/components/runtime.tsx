/*
  This is a modified version of the standard multiple choice question which uses the LARA interactive
  API showModal() function to show feedback via modal alert rather than inline feedback. At this point
  its sole purpose is to allow manual testing of the modal alert functionality.
 */

import React from "react";
import { v4 as uuidv4 } from "uuid";
import { showModal } from "@concord-consortium/lara-interactive-api";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";

import { IAuthoredState, IChoice, IInteractiveState } from "./app";

import css from "./runtime.scss";
import buttonCss from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";

const DEFAULT_INCORRECT = "Sorry, that is incorrect.";
const DEFAULT_CORRECT = "Yes! You are correct.";
const MULTI_CHOICE_INCOMPLETE = "You're on the right track, but you didn't select all the right answers yet.";

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

    // Question can be scored if it has at least one correct answer defined.
  const isScorable = !!authoredState.choices && authoredState.choices.filter(c => c.correct).length > 0;

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
    if (!report || !isScorable) {
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
            <DynamicText inline={true}>{choice.content}</DynamicText>
          </label>
        </div>
      );
    });
  };

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
  };

  const getFeedback = () => {
    let feedback = "";
    let isCorrect = false;
    if (!authoredState.multipleAnswers) {
      const choice = authoredState.choices.find(c => c.id === selectedChoiceIds[0]);
      if (!choice) return;
      isCorrect = !!choice.correct;
      if (authoredState.customFeedback && choice.choiceFeedback) {
        feedback = choice.choiceFeedback;
      } else {
        feedback = choice.correct ? DEFAULT_CORRECT : DEFAULT_INCORRECT;
      }
    } else {
      const correctChoices = authoredState.choices.filter(c => c.correct);
      const correctUserChoices = authoredState.choices.filter(c => selectedChoiceIds.includes(c.id) && c.correct);
      const incorrectUserChoices = authoredState.choices.filter(c => selectedChoiceIds.includes(c.id) && !c.correct);
      if (correctUserChoices.length === correctChoices.length && incorrectUserChoices.length === 0) {
        isCorrect = true;
        feedback = DEFAULT_CORRECT;
      } else if (incorrectUserChoices.length === 0) {
        feedback = MULTI_CHOICE_INCOMPLETE;
      } else {
        const firstIncorrect = incorrectUserChoices[0];
        if (authoredState.customFeedback && firstIncorrect.choiceFeedback) {
          feedback = firstIncorrect.choiceFeedback;
        } else {
          feedback = DEFAULT_INCORRECT;
        }
      }
    }
    return { isCorrect, feedback };
  };

  const layout = authoredState.layout || "vertical";
  const isAnswered = !!interactiveState?.selectedChoiceIds?.length;
  const handleShowAnswerFeedback = () => {
    const feedbackResult = getFeedback();
    const style = feedbackResult?.isCorrect ? "correct" : "incorrect";
    showModal({ type: "alert", uuid: uuidv4(), style, text: feedbackResult?.feedback });
  };

  return (
    <div>
      <fieldset>
        { authoredState.prompt &&
          <DynamicText>
            <legend className={css.prompt + " list-unstyled"}>
              { renderHTML(authoredState.prompt) }
            </legend>
          </DynamicText>
        }
        <div className={css.choices + " " + css[layout]} data-cy="choices-container">
          {
            authoredState.layout !== "dropdown"
            ? renderRadioChecks()
            : renderSelect()
          }
        </div>
      </fieldset>
      { authoredState.enableCheckAnswer && !readOnly &&
      <button className={buttonCss.apButton} onClick={handleShowAnswerFeedback}
          disabled={!isAnswered} data-cy="check-answer-button">
        Check Answer
      </button>
      }
    </div>
  );
};
