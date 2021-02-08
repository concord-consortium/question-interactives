import React from "react";
import LockIcon from "../icons/lock.svg";
import { log, useAuthoredState, useInteractiveState } from "@concord-consortium/lara-interactive-api";
import css from "../styles/helpers.scss";

interface IProps {
  isAnswered: boolean;
}

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const SubmitButton: React.FC<IProps> = ({ isAnswered }) => {
  const { authoredState } = useAuthoredState<{ required?: boolean }>();
  const { interactiveState, setInteractiveState } = useInteractiveState<{ submitted?: boolean, answerText?: string }>();

  if (!authoredState?.required || interactiveState?.submitted) {
    // Question is not required or has been already submitted.
    return null;
  }

  const handleSubmit = () => {
    setInteractiveState?.(prevState => ({...prevState, submitted: true }));
    log("answer submitted", { answer_text: interactiveState?.answerText });
  };

  return (
    <button className={css.apButton} onClick={handleSubmit} disabled={!isAnswered} data-cy="lock-answer-button">
      Submit <LockIcon className={css.smallIcon} />
    </button>
  );
};
