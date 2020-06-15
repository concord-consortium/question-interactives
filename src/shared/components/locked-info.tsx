import React from "react";
import LockIcon from "../icons/lock.svg";
import { useInteractiveState } from "@concord-consortium/lara-interactive-api";
import css from "./locked-info.scss";

// This hook can be used by any interactive that defines `required` property in its authored state and
// `submitted` property in its interactive state (student state).
export const LockedInfo: React.FC = () => {
  const { interactiveState } = useInteractiveState<{ submitted?: boolean }>();

  if (!interactiveState?.submitted) {
    // Question is not submitted, nothing to show.
    return null;
  }
  return <div className={css.locked}>Your answer has been submitted and is locked. <LockIcon className={css.mediumIcon} /></div>;
};
