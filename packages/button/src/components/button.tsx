import React, { useCallback, useEffect, useState } from "react";
import { log, useJobs } from "@concord-consortium/lara-interactive-api";
import classNames from "classnames";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";

import CorrectIcon from "../assets/correct-icon.svg";
import IncorrectIcon from "../assets/incorrect-icon.svg";

import css from "./button.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

/**
 * Parse a taskParams string into a key-value record.
 * Supports both query string format (key1=value1&key2=value2) and
 * newline-separated format (key1=value1\nkey2=value2).
 * Returns an empty object for empty/whitespace-only input.
 */
export const parseTaskParams = (taskParams: string | undefined): Record<string, string> => {
  if (!taskParams || !taskParams.trim()) {
    return {};
  }
  const normalized = taskParams.replace(/\r?\n|\r/g, "&");
  const params = new URLSearchParams(normalized);
  const result: Record<string, string> = Object.create(null);
  params.forEach((value, key) => {
    if (key) {
      result[key] = value;
    }
  });
  return result;
};

export const ButtonComponent: React.FC<IProps> = ({ authoredState }) => {
  const { createJob, latestJob } = useJobs();
  const [clicked, setClicked] = useState(false);

  // Reset clicked state whenever the job status changes so that the button
  // re-enables for retryable statuses (failure/cancelled) without flickering
  // during non-retryable transitions (the latestJob check keeps it disabled).
  useEffect(() => {
    setClicked(false);
  }, [latestJob?.status]);

  const handleClick = useCallback(async () => {
    setClicked(true);
    const task = authoredState.task?.trim() || "";
    const params = parseTaskParams(authoredState.taskParams);

    log("button clicked", { buttonLabel: authoredState.buttonLabel, task });

    try {
      await createJob({ ...params, task });
    } catch (error) {
      // createJob errors are not expected in normal operation — the mock executor
      // always resolves. Log for debugging if it ever happens.
      log("createJob error", { error: String(error) });
      setClicked(false);
    }
  }, [authoredState.task, authoredState.taskParams, authoredState.buttonLabel, createJob]);

  const buttonLabel = authoredState.buttonLabel || "Submit";
  const hasTask = !!(authoredState.task?.trim());
  const isDisabled = !hasTask || clicked || (latestJob != null && latestJob.status !== "failure" && latestJob.status !== "cancelled");

  const renderStatusMessage = () => {
    if (!hasTask) {
      return (
        <div className={css.statusMessage}>
          <IncorrectIcon className={css.statusIcon} aria-hidden="true" />
          <span>No task is configured for this button.</span>
        </div>
      );
    }
    if (!latestJob) {
      return null;
    }
    switch (latestJob.status) {
      case "queued":
      case "running":
        return (
          <div className={classNames(css.statusMessage, css.processingMessage)}>
            <div className={css.spinner} aria-hidden="true" />
            <span>{latestJob.result?.processingMessage || "Please wait\u2026"}</span>
          </div>
        );
      case "success":
        return (
          <div className={css.statusMessage}>
            <CorrectIcon className={css.statusIcon} aria-hidden="true" />
            <span>{latestJob.result?.message}</span>
          </div>
        );
      case "failure":
        return (
          <div className={css.statusMessage}>
            <IncorrectIcon className={css.statusIcon} aria-hidden="true" />
            <span>{latestJob.result?.message}</span>
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
