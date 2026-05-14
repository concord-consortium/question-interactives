import React, { CSSProperties } from "react";
import { IRecordings } from "./types";

import css from "./recording-strip.scss";
import ArrowIcon from "../assets/arrow-icon.svg";
import AddNewIcon from "../assets/add-new-icon.svg";
import WarningTriangleIcon from "../assets/warning-triangle-icon.svg";
import SpinnerIcon from "../assets/spinner-icon.svg";
import classNames from "classnames";

interface Props {
  isRecording: boolean;
  onNewRecording: () => void;
  onSelectRecording: (index: number) => void;
  recordings: IRecordings;
  currentRecordingIndex: number;
  brokenObjectIds: Set<string>;
  failedSavePlaceholder?: { index: number; snapshot?: string };
}

export const RecordingStrip = ({
  isRecording, onNewRecording, recordings, currentRecordingIndex, onSelectRecording,
  brokenObjectIds, failedSavePlaceholder
}: Props) => {
  const recordingsRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const hasEmptyRecording = recordings.length > 0 && !!recordings.find((rec) => !rec.startedAt);
  const newDisabled = isRecording || hasEmptyRecording;

  const checkScrollability = () => {
    if (recordingsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = recordingsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  React.useEffect(() => {
    checkScrollability();
  }, [recordings]);

  React.useEffect(() => {
    const handleResize = () => {
      checkScrollability();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    // Auto-scroll to the far right when a new recording is added
    if (recordingsRef.current?.scrollTo) {
      recordingsRef.current.scrollTo({
        left: recordingsRef.current.scrollWidth,
        behavior: "smooth"
      });
    }
  }, [recordings.length]);

  const handleScrollLeft = () => {
    if (recordingsRef.current?.scrollBy) {
      recordingsRef.current.scrollBy({ left: -40, behavior: "smooth" });
      setTimeout(checkScrollability, 300);
    }
  };

  const handleScrollRight = () => {
    if (recordingsRef.current?.scrollBy) {
      recordingsRef.current.scrollBy({ left: 40, behavior: "smooth" });
      setTimeout(checkScrollability, 300);
    }
  };

  return (
    <div className={css.recordingStrip}>
      <button className={css.leftButton} disabled={!canScrollLeft || isRecording} onClick={handleScrollLeft}>
        <ArrowIcon className={css.leftArrow} />
      </button>
      <div className={classNames(css.recordings, { [css.noRecordings]: recordings.length === 0 && !failedSavePlaceholder })} ref={recordingsRef} onScroll={checkScrollability}>
        {recordings.map((recording, index) => {
          // Saving-state signal: entry has no objectId AND is not the currently-recording
          // one. This window opens at recording-stop (between Stop and save resolution)
          // and self-clears when the success path adds objectId or the failure path
          // removes the entry.
          const isSaving =
            recording.objectId === undefined &&
            !(isRecording && index === currentRecordingIndex);
          const isBroken =
            recording.objectId !== undefined && brokenObjectIds.has(recording.objectId);
          const style: CSSProperties = recording.thumbnail ? {
            backgroundImage: `url(${recording.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          } : {};
          let ariaLabel: string | undefined;
          if (isSaving) {
            ariaLabel = `Recording ${index + 1} - saving...`;
          } else if (isBroken) {
            ariaLabel = `Recording ${index + 1} - data missing, cannot play, select to delete`;
          } else {
            ariaLabel = `Recording ${index + 1}`;
          }
          return (
            <button
              key={index}
              className={classNames(css.recordingButton, {
                [css.currentRecordingButton]: index === currentRecordingIndex && !isBroken,
                [css.currentBrokenRecordingButton]: index === currentRecordingIndex && isBroken,
              })}
              onClick={() => onSelectRecording(index)}
              // Saving-state entries are non-selectable: clicking would call
              // handleSelectRecording with objectId === undefined, which would publish
              // recording-selected and start polling, confusing live-graph during the
              // in-flight save window. agent-simulation's handleSelectRecording also
              // has a programmatic guard; this disabled prop is the UI half of the
              // defense-in-depth pair.
              disabled={isSaving || (isRecording && index !== currentRecordingIndex)}
              style={style}
              data-saving={isSaving || undefined}
              data-broken={isBroken || undefined}
              aria-label={ariaLabel}
            >
              {isSaving && <span className={css.savingOverlay} aria-hidden="true" />}
              {isSaving && <SpinnerIcon className={css.savingSpinner} aria-hidden="true" />}
              {isBroken && <span className={css.brokenOverlay} />}
              {isBroken && <WarningTriangleIcon className={css.brokenIcon} aria-hidden="true" />}
              <span className={classNames(css.recordingIndex, { [css.currentRecording]: index === currentRecordingIndex })}>
                {index + 1}
              </span>
            </button>
          );
        })}
        {failedSavePlaceholder && (
          // role="img" so screen readers honor aria-label on this otherwise-roleless,
          // non-focusable div. The placeholder is a visual symbol (warning triangle +
          // overlay) representing the failed recording — role="img" matches that intent
          // exactly and is the standard ARIA pattern.
          <div
            className={classNames(css.recordingButton, css.brokenRecording)}
            data-broken="true"
            role="img"
            aria-label={`Recording ${failedSavePlaceholder.index + 1} - failed to save`}
            style={failedSavePlaceholder.snapshot ? {
              backgroundImage: `url(${failedSavePlaceholder.snapshot})`,
              backgroundSize: "cover",
              backgroundPosition: "center"
            } : undefined}
          >
            <span className={css.brokenOverlay} />
            <WarningTriangleIcon className={css.brokenIcon} aria-hidden="true" />
            <span className={classNames(css.recordingIndex)}>{failedSavePlaceholder.index + 1}</span>
          </div>
        )}
        <button className={css.newRecordingButton} onClick={onNewRecording} disabled={newDisabled}>
          <AddNewIcon className={css.buttonIcon} />
          <span className={css.newRecordingLabel}>New</span>
        </button>
        {recordings.length === 0 && !failedSavePlaceholder && (
          <div className={css.noRecordingsMessage}>
            Recordings
          </div>
        )}
      </div>
      <button className={css.rightButton} disabled={!canScrollRight || isRecording} onClick={handleScrollRight}>
        <ArrowIcon className={css.rightArrow} />
      </button>
    </div>
  );
};
