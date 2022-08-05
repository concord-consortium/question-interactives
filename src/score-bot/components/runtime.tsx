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
import { getLastAttemptAnswerText, getLastFeedback, getLastScore, getMaxScore, getValidScoreMapping, isFeedbackOutdated } from "../utils";

export const isAnswered = (interactiveState?: IInteractiveState | null) => !!interactiveState?.answerText;

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const [requestInProgress, setRequestInProgress] = useState(false);
  const readOnly = report || requestInProgress;
  const placeholderText = "Please type your answer here.";
  const answerText = !interactiveState?.answerText ? authoredState.defaultAnswer : interactiveState.answerText;
  const scoreMapping = getValidScoreMapping(authoredState);

  const decorateOptions = useGlossaryDecoration();

  const maxScore = getMaxScore(authoredState);
  const lastScore = getLastScore(interactiveState);
  const lastFeedback = getLastFeedback(authoredState, interactiveState);
  const feedbackOutdated = isFeedbackOutdated(interactiveState);
  const submitDisabled = !isAnswered(interactiveState) || !feedbackOutdated || readOnly;

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
      // If user typed something and then reverted to the previously submitted answer, there's no need to resubmit.
      submitted: value === getLastAttemptAnswerText(interactiveState)
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
      // It seems that ScoreBOT API might not work correctly and ignore ItemID. If it was working correctly,
      // it should return scores within [0, 6] range for explanation item and scores within [0, 4] for rationale items.
      // In practice, it seems to always return score in [0, 6] range. See: https://www.pivotaltracker.com/story/show/182902508
      // This is not a pretty workaround that replicates what probably happened in the old LARA implementation.
      // Score value will be truncated to whatever maxScore is defined by the authored state (number of score mappings).
      const truncatedScore = Math.min(maxScore || 6, score);

      const attempt = { score: truncatedScore, answerText: interactiveState.answerText };
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        attempts: prevState?.attempts ? [ ...prevState.attempts, attempt ] : [ attempt ],
        submitted: true
      }));
      log("scorebot feedback received", { item_id: authoredState.scoreBotItemId, answer_text: interactiveState?.answerText, score: truncatedScore });
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
        lastScore !== null && lastFeedback !== null && maxScore !== null && !requestInProgress &&
        <Feedback score={lastScore} feedback={lastFeedback} maxScore={maxScore} outdated={feedbackOutdated} />
      }
    </fieldset>
  );
};
