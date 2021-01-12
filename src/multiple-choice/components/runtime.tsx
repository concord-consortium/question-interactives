import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { IAuthoredState, IChoice, IInteractiveState } from "./types";
import CheckIcon from "../../shared/icons/correct.svg";
import CrossIcon from "../../shared/icons/incorrect.svg";
import { renderHTML } from "../../shared/utilities/render-html";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import buttonCss from "../../shared/styles/helpers.scss";
import css from "./runtime.scss";
import { log, useCustomMessages, ICustomMessage } from "@concord-consortium/lara-interactive-api";
import CheckMarkIcon from "../../shared/icons/check_mark.svg";
import XMarkIcon from "../../shared/icons/x_mark.svg";

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
  const decorateOptions = useGlossaryDecoration();
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showDistractor, setShowDistractor] = useState(false);

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

  useCustomMessages((msg: ICustomMessage) => {
    if (msg.type === "teacher-edition:showCorrectOverlay") {
      setShowCorrect(true);
      setShowDistractor(false);
    } else if (msg.type === "teacher-edition:showDistractorOverlay") {
      setShowDistractor(true);
      setShowCorrect(false);
    } else if (msg.type === "teacher-edition:hideOverlay") {
      setShowCorrect(false);
      setShowDistractor(false);
    }
  });

  const getAnswerText = (choiceIds: string[]) => {
    return choiceIds.map(choiceId => {
      const choice = authoredState.choices.find(c => c.id === choiceId);
      if (!choice) {
        return "";
      }
      return choice.correct ? `(correct) ${choice.content}` : choice.content;
    }).join(", ");
  };

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
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "multiple_choice_answer",
      selectedChoiceIds: newChoices,
      answerText: getAnswerText(newChoices)
    }));
    setShowAnswerFeedback(false);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newChoice = [ event.target.value ];
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "multiple_choice_answer",
      selectedChoiceIds: newChoice,
      answerText: getAnswerText(newChoice)
    }));
    setShowAnswerFeedback(false);
  };

  const getChoiceClass = (choice: IChoice, checked: boolean) => {
    if (!report || !isScorable) {
      return "";
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
    console.log(authoredState);
    return authoredState.choices && authoredState.choices.map(choice => {
      const checked = selectedChoiceIds.indexOf(choice.id) !== -1;
      const inputId = baseElementId + choice.id;
      return (
        <div key={choice.id} className={`radio-choice ${getChoiceClass(choice, checked)}`}>
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
          {choice.correct !== undefined && choice.correct === true && showCorrect &&
            <div className={css.markContainer}>
              <CheckMarkIcon className={`${css.mark} ${css.correctCheck}`} />
            </div>
          }
          {choice.correct !== undefined && choice.correct === false && showDistractor &&
            <div className={css.markContainer}>
              <XMarkIcon className={`${css.mark} ${css.incorrectCheck}`} />
            </div>
          }
          <label htmlFor={inputId}>
            {choice.content}
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

  const renderFeedback = () => {
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
    const symbolCss = `${css.symbol} ${isCorrect ? css.correctSymbol : css.incorrectSymbol}`;
    const symbol = isCorrect ? <CheckIcon /> : <CrossIcon />;
    return (
      <div className={css.answerFeedback} data-cy={`feedback-${isCorrect}`}>
        <div className={symbolCss}>{ symbol }</div>
        <div className={css.feedback}>{ feedback }</div>
      </div>
    );
  };

  const layout = authoredState.layout || "vertical";
  const isAnswered = !!interactiveState?.selectedChoiceIds?.length;
  const handleShowAnswerFeedback = () => {
    setShowAnswerFeedback(!showAnswerFeedback);
    log("answer feedback shown");
  };

  return (
    <div>
      <fieldset>
        { authoredState.prompt &&
          <DecorateChildren decorateOptions={decorateOptions}>
            <legend className={css.prompt + " list-unstyled "}>
              {renderHTML(authoredState.prompt)}
            </legend>
          </DecorateChildren> }
        <div className={css.choices + " " + (css[layout] || "")} data-cy="choices-container">
          {
            authoredState.layout !== "dropdown"
            ? renderRadioChecks()
            : renderSelect()
          }
        </div>
      </fieldset>
      {
        showAnswerFeedback && !readOnly && renderFeedback()
      }
      { authoredState.enableCheckAnswer && !readOnly &&
      <button className={buttonCss.laraButton} onClick={handleShowAnswerFeedback}
          disabled={!isAnswered} data-cy="check-answer-button">
        Check answer
      </button>
      }
    </div>
  );
};
