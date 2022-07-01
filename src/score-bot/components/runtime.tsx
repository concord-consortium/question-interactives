import React, { useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./types";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import { log } from "@concord-consortium/lara-interactive-api";
import { getScoreBOTFeedback } from "../get-scorebot-feedback";
import { Feedback } from "./feedback";

import css from "./runtime.scss";
import cssHelpers from "../../shared/styles/helpers.scss";

export const isAnswered = (interactiveState?: IInteractiveState | null) => !!interactiveState?.answerText;

const shouldSubmitCurrentAnswer = (interactiveState?: IInteractiveState | null) => {
  if (!interactiveState?.attempts || interactiveState.attempts.length === 0) {
    return true;
  }
  const lastAttempt = interactiveState.attempts[interactiveState.attempts.length - 1];
  return lastAttempt.answerText !== interactiveState.answerText;
};

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const validateScoreMapping = (scoreMapping: string[]) => {
  if ([0, 1, 2, 3, 4, 5, 6].every(idx => scoreMapping[idx])) {
    // All 7 elements of score mapping are defined (from 0 to 6).
    return scoreMapping;
  }
  if ([0, 1, 2, 3, 4].every(idx => scoreMapping[idx]) && [5, 6].every(idx => !scoreMapping[idx])) {
    // 0-4 elements of score mapping are defined, and 5-6 elements are undefined / empty.
    return scoreMapping.slice(0, 5);
  }
  // Do not allow any other combinations, as it's not supported by the ScoreBOT scale and ML model.
  return null;
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const [requestInProgress, setRequestInProgress] = useState(false);
  const readOnly = report || requestInProgress;
  const placeholderText = "Please type your answer here.";
  const answerText = !interactiveState?.answerText ? authoredState.defaultAnswer : interactiveState.answerText;
  const scoreMapping = validateScoreMapping(authoredState.scoreMapping || []);

  const decorateOptions = useGlossaryDecoration();

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
      score: undefined,
      submitted: false
    }));
  };

  const handleGetFeedback = async () => {
    if (!interactiveState?.answerText || !authoredState.scoreBotItemId) {
      return;
    }
    setRequestInProgress(true);
    // `submitted: false` seems counter-intuitive, but this will lock Activity Player page.
    // `submitted: true` will be set when ScoreBOT API responds.
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "interactive_state",
      submitted: false // lock AP page
    }));
    log("scorebot feedback requested", { item_id: authoredState.scoreBotItemId, answer_text: interactiveState.answerText });

    try {
      const score = await getScoreBOTFeedback(authoredState.scoreBotItemId, interactiveState.answerText);
      const attempt = { score, answerText: interactiveState.answerText };
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        score,
        attempts: prevState?.attempts ? [ ...prevState.attempts, attempt ] : [ attempt ],
        submitted: true
      }));
      log("scorebot feedback received", { item_id: authoredState.scoreBotItemId, answer_text: interactiveState?.answerText, score });
    } catch (error) {
      console.error("ScoreBOT request has failed", error);
      window.alert("ScoreBOT request has failed. Please try to submit your question gain.");

      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        submitted: true // unlock AP page even in case of ScoreBOT failure
      }));
    } finally {
      setRequestInProgress(false);
    }
  };

  const lastAttempt = interactiveState?.attempts ? interactiveState.attempts[interactiveState.attempts.length - 1] : null;
  const feedbackOutdated = lastAttempt?.answerText !== interactiveState?.answerText;
  const submitDisabled = !isAnswered(interactiveState) || !shouldSubmitCurrentAnswer(interactiveState) || readOnly;

  return (
    <fieldset className={css.scoreBot}>
      { authoredState.prompt &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <legend className={css.prompt} data-testid="legend">
            {renderHTML(authoredState.prompt)}
          </legend>
        </DecorateChildren> }
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
      <button className={cssHelpers.apButton} onClick={handleGetFeedback} disabled={submitDisabled} data-cy="scorebot-feedback-button">
        Submit
      </button>
      {
        lastAttempt !== null && !requestInProgress &&
        <Feedback score={lastAttempt.score} feedback={scoreMapping[lastAttempt.score]} maxScore={scoreMapping.length - 1} outdated={feedbackOutdated} />
      }
    </fieldset>
  );
};
