import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { DEFAULT_NO_DATA_MESSAGE, DEFAULT_NO_SOURCE_MESSAGE, IAuthoredState } from "./types";
import { ActivityState, useLiveStream } from "./use-live-stream";
import { useToggleState } from "./use-toggle-state";
import { Chart } from "./chart";
import { Legend } from "./legend";
import { logToggleSeries, logXAxisCompressed } from "./logging";

import css from "./runtime.scss";

const X_AXIS_MISSING_MESSAGE =
  "Sorry, this chart can't be displayed. There is a problem with how this activity was set up.";
const FILTER_EMPTY_MESSAGE =
  "No columns to display. There may be a problem with how this activity was set up.";

const stateLabels: Record<ActivityState, string> = {
  idle: "",
  playing: "Playing",
  paused: "Paused",
  recording: "Recording",
  stopped: "Stopped",
  recorded: "Recorded",
};

interface IProps {
  authoredState: IAuthoredState;
}

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const linkedInteractiveId = useLinkedInteractiveId("dataSourceInteractive");
  const liveStream = useLiveStream(authoredState, linkedInteractiveId);
  const { viewState, activeColumns, cols, rows, updatedAt, recordingEpoch, activityState, sourceTitle, statusMessage } = liveStream;
  const { visibility, setVisibility, registerColumns, isVisible } = useToggleState();

  // rAF-coalesced rendering: coalesce tick-driven Chart updates to animation frame
  // boundaries. Runtime still re-renders on every tick (via the reducer), but Chart
  // is memoized and only re-renders when coalescedUpdatedAt changes.
  const [coalescedUpdatedAt, setCoalescedUpdatedAt] = useState(0);
  const pendingUpdatedAtRef = useRef(updatedAt);
  const rafHandleRef = useRef<number | null>(null);
  pendingUpdatedAtRef.current = updatedAt;

  useEffect(() => {
    if (updatedAt === coalescedUpdatedAt) {
      return;
    }
    if (rafHandleRef.current !== null) {
      return;
    }
    rafHandleRef.current = requestAnimationFrame(() => {
      rafHandleRef.current = null;
      setCoalescedUpdatedAt(pendingUpdatedAtRef.current);
    });
  }, [updatedAt, coalescedUpdatedAt]);

  useEffect(() => {
    return () => {
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
      }
    };
  }, []);

  const prevColsRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (cols && cols !== prevColsRef.current) {
      prevColsRef.current = cols;
      registerColumns(activeColumns.map(c => c.column));
    }
  }, [cols, activeColumns, registerColumns]);

  const handleToggle = useCallback(
    (column: string) => {
      const current = isVisible(column);
      const newVisible = !current;
      setVisibility(column, newVisible);
      const colEntry = activeColumns.find(c => c.column === column);
      logToggleSeries({
        column,
        label: colEntry?.label ?? column,
        visible: newVisible,
      });
    },
    [isVisible, setVisibility, activeColumns]
  );

  const handleXAxisCompressed = useCallback(() => {
    logXAxisCompressed();
  }, []);

  const chartHeight = authoredState.chartHeight ?? 400;
  const noSourceMessage = authoredState.noSourceMessage?.trim() || DEFAULT_NO_SOURCE_MESSAGE;
  const noDataMessage = authoredState.noDataMessage?.trim() || DEFAULT_NO_DATA_MESSAGE;
  const chartTitle = authoredState.chartTitle?.trim();
  const ariaLabel = chartTitle ? `Live graph: ${chartTitle}` : "Live graph";

  const stateLabel = stateLabels[activityState];

  let composedTitle = chartTitle ?? "";
  if (activityState !== "idle") {
    if (sourceTitle) {
      composedTitle = composedTitle ? `${composedTitle}: ${sourceTitle}` : sourceTitle;
    }
    if (stateLabel) {
      composedTitle = composedTitle ? `${composedTitle} (${stateLabel})` : `(${stateLabel})`;
    }
  }

  const [activityAnnouncement, setActivityAnnouncement] = useState("");
  const prevActivityStateRef = useRef<ActivityState>("idle");
  useEffect(() => {
    if (prevActivityStateRef.current !== activityState) {
      prevActivityStateRef.current = activityState;
      setActivityAnnouncement(stateLabel);
    }
  }, [activityState, stateLabel]);

  let visibleMessage = "";
  if (statusMessage) { visibleMessage = statusMessage; }
  else if (viewState === "no-source") { visibleMessage = noSourceMessage; }
  else if (viewState === "waiting") { visibleMessage = noDataMessage; }
  else if (viewState === "filter-empty") { visibleMessage = FILTER_EMPTY_MESSAGE; }
  const assertiveText = viewState === "x-axis-missing" ? X_AXIS_MISSING_MESSAGE : "";

  return (
    <div className={css.liveGraph} style={{height: chartHeight}} role="region" data-view-state={viewState} aria-label={ariaLabel}>
      <div aria-live="polite" className={visibleMessage ? css.message : css.hidden}>
        {visibleMessage}
      </div>
      <div aria-live="polite" className={css.hidden}>
        {activityAnnouncement}
      </div>
      <div role="alert" aria-live="assertive" className={assertiveText ? css.warning : css.hidden}>
        {assertiveText}
      </div>
      {viewState === "plotting" && cols && (
        <div className={`${css.chartArea} ${css[`legend-${authoredState.legendPosition ?? "top"}`]}`}>
          <Legend
            columns={activeColumns}
            visibility={visibility}
            onToggle={handleToggle}
            position={authoredState.legendPosition ?? "top"}
          />
          <div className={css.chart}>
            <Chart
              authoredState={authoredState}
              composedTitle={composedTitle}
              activeColumns={activeColumns}
              cols={cols}
              rows={rows}
              updatedAt={coalescedUpdatedAt}
              recordingEpoch={recordingEpoch}
              visibility={visibility}
              onXAxisCompressed={handleXAxisCompressed}
            />
          </div>
        </div>
      )}
    </div>
  );
};
