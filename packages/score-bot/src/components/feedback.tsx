
import React from "react";
import classNames from "classnames";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { Score } from "./score";

import css from "./feedback.scss";

interface IProps {
  score: number;
  feedback: string;
  maxScore: number;
  outdated: boolean;
}

export const Feedback: React.FC<IProps> = ({ score, maxScore, feedback, outdated }) => {
  return (
    <div className={classNames(css.scoreBotFeedback, { [css.outdated]: outdated })} data-cy="score-bot-feedback">
      <div className={css.header}><DynamicText>Feedback</DynamicText></div>
      { outdated && <div className={css.outdatedMsg}><DynamicText>Please submit your question again to get updated feedback.</DynamicText></div> }
      <div className={css.score}><Score score={score} maxScore={maxScore} /></div>
      <div className={css.feedback}>
        <DynamicText>{renderHTML(feedback)}</DynamicText>
      </div>
    </div>
  );
};
