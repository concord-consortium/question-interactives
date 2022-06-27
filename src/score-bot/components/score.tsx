import React from "react";
import classNames from "classnames";
import Pointer from "../assets/pointer.svg";
import css from "./score.scss";

interface IProps {
  score: number;
  maxScore: number;
}

export const Score: React.FC<IProps> = ({ score, maxScore }) => {
  const labels = maxScore === 6 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  return (
    <div className={css.scoreBotScore} data-cy="score-bot-score">
      <div className={css.title}>Level of Scientific Explanation</div>
      <div className={css.scale}>
        {
          labels.map(label => (
            <div key={label} className={classNames(css.box, css[`scale-to-${maxScore}`], css[`color-${label}-${maxScore}`])} />
          ))
        }
        <Pointer className={css.pointer} style={{ left: `${((score + 0.5) / labels.length) * 100}%` }} />
      </div>
      <div className={css.labels}>
        {
          labels.map(label => (
            <div key={label} className={classNames(css.label, css[`scale-to-${maxScore}`])} >{ label }</div>
          ))
        }
      </div>
    </div>
  );
};
