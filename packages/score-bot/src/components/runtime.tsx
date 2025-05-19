import React from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { Feedback } from "./feedback";
import { IAuthoredState, IInteractiveState } from "./types";
import { getLastFeedback, getLastScore, getMaxScore, getValidScoreMapping, isFeedbackOutdated } from "../utils";

import css from "./runtime.scss";

export const isAnswered = (interactiveState?: IInteractiveState | null) => !!interactiveState?.answerText;

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report;
  const placeholderText = "Please type your answer here.";
  const answerText = !interactiveState?.answerText ? authoredState.defaultAnswer : interactiveState.answerText;
  const scoreMapping = getValidScoreMapping(authoredState);

  const decorateOptions = useGlossaryDecoration();

  const maxScore = getMaxScore(authoredState);
  const lastScore = getLastScore(interactiveState);
  const lastFeedback = getLastFeedback(authoredState, interactiveState);
  const feedbackOutdated = isFeedbackOutdated(interactiveState);

  if (!authoredState.scoreBotItemId) {
    return <div>Missing ScoreBOT Item ID</div>;
  }
  if (!scoreMapping) {
    return <div>Score Mapping must have 5 or 7 elements defined</div>;
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "interactive_state",
      answerText: value,
      submitted: true
    }));
  };

  return (
    <fieldset className={css.scoreBot}>
      { authoredState.prompt &&
        <DynamicText>
          <DecorateChildren decorateOptions={decorateOptions}>
            <legend className={css.prompt} data-testid="legend">
              {renderHTML(authoredState.prompt)}
            </legend>
          </DecorateChildren>
        </DynamicText>
      }

      <div className={css.inputContainer}>
        <textarea
          value={answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={placeholderText}
          data-testid="response-textarea"
        />
      </div>
      {
        lastScore !== null && lastFeedback !== null && maxScore !== null &&
        <Feedback score={lastScore} feedback={lastFeedback} maxScore={maxScore} outdated={feedbackOutdated} />
      }
    </fieldset>
  );
};
