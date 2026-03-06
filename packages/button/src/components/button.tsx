import React, { useCallback, useEffect, useRef, useState } from "react";
import { log } from "@concord-consortium/lara-interactive-api";
import classNames from "classnames";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState, IScriptResponse } from "./types";
import { executeScript } from "./execute-script";

import CorrectIcon from "../assets/correct-icon.svg";
import IncorrectIcon from "../assets/incorrect-icon.svg";

import css from "./button.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const ButtonComponent: React.FC<IProps> = ({ authoredState }) => {
  const [scriptResponse, setScriptResponse] = useState<IScriptResponse | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleClick = useCallback(async () => {
    const scriptUrl = authoredState.scriptUrl || "";

    log("button clicked", { buttonLabel: authoredState.buttonLabel, scriptUrl });

    const { queued, result } = executeScript(scriptUrl);

    // Apply queued state synchronously to prevent double-clicks
    setScriptResponse(queued);

    try {
      const response = await result;

      if (!mountedRef.current) {
        return;
      }

      setScriptResponse(response);

      log("script response", { status: response.status, message: response.message });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setScriptResponse({
        status: "failure",
        message: "An unexpected error occurred.",
        disableButton: false,
      });
    }
  }, [authoredState.scriptUrl, authoredState.buttonLabel]);

  const buttonLabel = authoredState.buttonLabel || "Submit";
  const hasScriptUrl = !!(authoredState.scriptUrl);
  const isDisabled = !hasScriptUrl || (scriptResponse?.disableButton ?? false);

  const renderStatusMessage = () => {
    if (!hasScriptUrl) {
      return (
        <div className={css.statusMessage}>
          <IncorrectIcon className={css.statusIcon} aria-hidden="true" />
          <span>No script URL is configured for this button.</span>
        </div>
      );
    }
    if (!scriptResponse) {
      return null;
    }
    switch (scriptResponse.status) {
      case "queued":
        return (
          <div className={classNames(css.statusMessage, css.processingMessage)}>
            <div className={css.spinner} aria-hidden="true" />
            <span>{scriptResponse.processingMessage || "Please wait\u2026"}</span>
          </div>
        );
      case "success":
        return (
          <div className={css.statusMessage}>
            <CorrectIcon className={css.statusIcon} aria-hidden="true" />
            <span>{scriptResponse.message}</span>
          </div>
        );
      case "failure":
        return (
          <div className={css.statusMessage}>
            <IncorrectIcon className={css.statusIcon} aria-hidden="true" />
            <span>{scriptResponse.message}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={css.buttonComponent}>
      <button
        className={css.actionButton}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {buttonLabel}
      </button>

      {/* Container must always be in DOM for aria-live to announce changes */}
      <div className={css.statusRegion} role="status" aria-live="polite">
        {renderStatusMessage()}
      </div>
    </div>
  );
};
