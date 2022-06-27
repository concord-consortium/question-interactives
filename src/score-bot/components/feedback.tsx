import React from "react";
import { renderHTML } from "../../shared/utilities/render-html";
import css from "./feedback.scss";
import { Score } from "./score";

interface IProps {
  score: number;
  feedback: string;
  maxScore: number;
}

export const Feedback: React.FC<IProps> = ({ score, maxScore, feedback }) => {
  return (
    <div className={css.scoreBotFeedback} data-cy="score-bot-feedback">
      <div className={css.header}>Feedback</div>
      <div className={css.score}><Score score={score} maxScore={maxScore} /></div>
      <div className={css.feedback}>
        {renderHTML(feedback)}
      </div>
    </div>
  );
};
