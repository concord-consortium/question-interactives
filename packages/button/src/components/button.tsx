import React, { useCallback, useEffect, useRef, useState } from "react";
import { log, useJobs } from "@concord-consortium/lara-interactive-api";
import classNames from "classnames";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";

import CorrectIcon from "../assets/correct-icon.svg";
import IncorrectIcon from "../assets/incorrect-icon.svg";

import css from "./button.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

type LocalStatus =
  | { status: "clicked" }
  | { status: "error"; errorMessage: string };

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
  const [localStatus, setLocalStatus] = useState<LocalStatus | undefined>(undefined);
  const createdJobId = useRef<string | null>(null);

  // Reset local status whenever the job status changes so that the button
  // re-enables for retryable statuses (failure/cancelled) without flickering
  // during non-retryable transitions (the latestJob check keeps it disabled).
  useEffect(() => {
    setLocalStatus(undefined);
  }, [latestJob?.status]);

  // Log terminal job statuses (success, failure, cancelled). The createdJobId ref
  // ensures we only log jobs created by this user's click in this session — not
  // stale jobs hydrated from persistence on page load.
  useEffect(() => {
    if (!latestJob || latestJob.id !== createdJobId.current) {
      return;
    }
    const { status, id, result } = latestJob;
    const label = authoredState.buttonLabel || "Submit";
    const task = authoredState.task?.trim() || "";
    if (status === "success") {
      log("button interactive: job success", { jobId: id, message: result?.message, buttonLabel: label, task });
    } else if (status === "failure") {
      log("button interactive: job failure", { jobId: id, message: result?.message, buttonLabel: label, task });
    } else if (status === "cancelled") {
      log("button interactive: job cancelled", { jobId: id, buttonLabel: label, task });
    } else {
      return; // queued/running — don't clear ref yet
    }
    createdJobId.current = null;
  }, [latestJob, authoredState.buttonLabel, authoredState.task]);

  const handleClick = useCallback(async () => {
    setLocalStatus({ status: "clicked" });
    const task = authoredState.task?.trim() || "";
    const params = parseTaskParams(authoredState.taskParams);

    log("button interactive: button clicked", { buttonLabel: authoredState.buttonLabel || "Submit", task });

    try {
      const job = await createJob({ ...params, task });
      createdJobId.current = job.id;
      log("button interactive: job created", { jobId: job.id, buttonLabel: authoredState.buttonLabel || "Submit", task });
    } catch (err) {
      log("button interactive: job create error", { error: String(err) });
      setLocalStatus({ status: "error", errorMessage: "Something went wrong. Please try again." });
    }
  }, [authoredState.task, authoredState.taskParams, authoredState.buttonLabel, createJob]);

  const buttonLabel = authoredState.buttonLabel || "Submit";
  const hasTask = !!(authoredState.task?.trim());
  const isDisabled = !hasTask || localStatus?.status === "clicked" || (latestJob != null && latestJob.status !== "failure" && latestJob.status !== "cancelled");

  const renderStatusMessage = () => {
    if (!hasTask) {
      return (
        <div className={css.statusMessage}>
          <IncorrectIcon className={css.statusIcon} aria-hidden="true" />
          <span>No task is configured for this button.</span>
        </div>
      );
    }
    if (localStatus?.status === "error") {
      return (
        <div className={css.statusMessage}>
          <IncorrectIcon className={css.statusIcon} aria-hidden="true" />
          <span>{localStatus.errorMessage}</span>
        </div>
      );
    }
    if (!latestJob) {
      if (localStatus?.status === "clicked") {
        return (
          <div className={classNames(css.statusMessage, css.processingMessage)}>
            <div className={css.spinner} aria-hidden="true" />
            <span>Please wait{"\u2026"}</span>
          </div>
        );
      }
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
