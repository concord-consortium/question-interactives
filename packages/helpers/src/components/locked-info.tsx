import React from "react";
import LockIcon from "../icons/lock.svg";
import { renderHTML } from "../utilities/render-html";
import { useInteractiveState, useAuthoredState } from "@concord-consortium/lara-interactive-api";
import { DynamicText } from "@concord-consortium/dynamic-text";

import css from "./locked-info.scss";

// This component can be used by any interactive that defines `required` property in its
// authored state and `submitted` property in its interactive state (student state).
export const LockedInfo: React.FC = () => {
  const { authoredState } = useAuthoredState<{ predictionFeedback?: string }>();
  const { interactiveState } = useInteractiveState<{ submitted?: boolean }>();

  if (!interactiveState?.submitted) {
    // Question is not submitted, nothing to show.
    return null;
  }

  return (
    <div className={css.locked} data-cy="locked-info">
      <div className={css.header}><DynamicText inline={true}>Your answer has been submitted and is locked.</DynamicText> <LockIcon className={css.mediumIcon} /></div>
      {
        authoredState?.predictionFeedback &&
          <div className={css.feedback}>
            <DynamicText>{renderHTML(authoredState.predictionFeedback)}</DynamicText>
          </div>
      }
    </div>
  );
};
