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

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const validateScoreMapping = (scoreMapping: string[]) => {
  if (scoreMapping[0] && scoreMapping[1] && scoreMapping[2] && scoreMapping[3] && scoreMapping[4] && !scoreMapping[5] && !scoreMapping[6]) {
    return scoreMapping.slice(0, 5);
  }
  if (scoreMapping[0] && scoreMapping[1] && scoreMapping[2] && scoreMapping[3] && scoreMapping[4] && scoreMapping[5] && scoreMapping[6]) {
    return scoreMapping;
  }
  return null;
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const [requestInProgress, setRequestInProgress] = useState(false);
  const readOnly = report;
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
      answerText: value
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
      submitted: false
    }));
    log("scorebot feedback requested", { item_id: authoredState.scoreBotItemId, answer_text: interactiveState.answerText });

    try {
      const score = await getScoreBOTFeedback(authoredState.scoreBotItemId, interactiveState.answerText);
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        score,
        attempts: prevState?.attempts ? prevState.attempts + 1 : 1
      }));
      log("scorebot feedback received", { item_id: authoredState.scoreBotItemId, answer_text: interactiveState?.answerText, score });
    } catch (error) {
      console.error("ScoreBOT feedback has failed", error);
    } finally {
      setRequestInProgress(false);
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        submitted: true // unlock AP page
      }));
    }
  };

  const submitDisabled = !isAnswered(interactiveState) || requestInProgress;

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
        interactiveState?.score != null && <Feedback score={interactiveState.score} feedback={scoreMapping[interactiveState.score]} maxScore={scoreMapping.length - 1} />
      }
    </fieldset>
  );
};
