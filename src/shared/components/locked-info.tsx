import React from "react";
import LockIcon from "../icons/lock.svg";
import css from "./locked-info.scss";

interface IProps {
  interactiveState: { submitted?: boolean } | undefined;
}

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const LockedInfo: React.FC<IProps> = ({ interactiveState }) => {
  if (!interactiveState?.submitted) {
    // Question is not submitted, nothing to show.
    return null;
  }
  return <div className={css.locked}>Your answer is now locked. <LockIcon className={css.mediumIcon} /></div>;
};
