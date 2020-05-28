import React, { useEffect } from "react";
import LockIcon from "../icons/lock.svg";
import css from "../styles/helpers.scss";

interface IConfig {
  authoredState: { required?: boolean } | undefined;
  interactiveState: { submitted?: boolean } | undefined;
  setInteractiveState: ((interactiveState: {submitted?: boolean}) => void) | undefined;
  setNavigation: ((enableForwardNav: boolean, message: string) => void) | undefined;
  isAnswered: boolean;
}

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const useRequiredQuestion = ({ authoredState, interactiveState, setInteractiveState, setNavigation, isAnswered }: IConfig) => {
  const handleSubmit = () => {
    setInteractiveState?.(Object.assign({}, interactiveState, { submitted: true }));
  };

  useEffect(() => {
    if (authoredState?.required && setNavigation) {
      const forwardNavEnabled = !!interactiveState?.submitted;
      setNavigation(forwardNavEnabled, forwardNavEnabled ? "" : "Please submit an answer first.");
    }
  }, [authoredState?.required, interactiveState?.submitted]);

  const submitButton = authoredState?.required && !interactiveState?.submitted ? (
    <button className={css.laraButton} onClick={handleSubmit} disabled={!isAnswered}>
      Submit <LockIcon className={css.smallIcon} />
    </button>
  ) : null;

  const lockedInfo = authoredState?.required && interactiveState?.submitted ? (
    <div className={css.locked}>Your answer is now locked. <LockIcon className={css.mediumIcon} /></div>
  ) : null;

  return {
    submitButton,
    lockedInfo
  };
};
