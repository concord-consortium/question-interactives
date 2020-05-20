import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import css from "../styles/helpers.scss";

interface IConfig {
  authoredState: { required?: boolean };
  interactiveState: { submitted?: boolean } | undefined;
  setInteractiveState: ((interactiveState: {submitted?: boolean}) => void) | undefined;
  setNavigation: ((enableForwardNav: boolean, message: string) => void) | undefined;
  submitEnabled: boolean;
}

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const useRequiredQuestion = ({ authoredState, interactiveState, setInteractiveState, setNavigation, submitEnabled }: IConfig) => {
  const handleSubmit = () => {
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { submitted: true }));
    }
  };

  useEffect(() => {
    if (authoredState.required && setNavigation) {
      const forwardNavEnabled = !!interactiveState?.submitted;
      setNavigation(forwardNavEnabled, forwardNavEnabled ? "" : "Please submit an answer first.");
    }
  }, [authoredState, interactiveState, authoredState]);

  const submitButton = authoredState?.required && !interactiveState?.submitted ? (
    <button className={css.laraButton} onClick={handleSubmit} disabled={!submitEnabled}>
      Submit <FontAwesomeIcon icon={faLock} size="sm" />
    </button>
  ) : null;

  const lockedInfo = authoredState?.required && interactiveState?.submitted ? (
    <div className={css.locked}>Your answer is now locked. <FontAwesomeIcon icon={faLock} size="sm" /></div>
  ) : null;

  return {
    submitButton,
    lockedInfo
  };
};
