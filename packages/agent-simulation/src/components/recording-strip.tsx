import React, { CSSProperties } from "react";
import { IRecordings } from "./types";

import css from "./recording-strip.scss";
import ArrowIcon from "../assets/arrow-icon.svg";
import AddNewIcon from "../assets/add-new-icon.svg";
import classNames from "classnames";

interface Props {
  isRecording: boolean;
  onNewRecording: () => void;
  onSelectRecording: (index: number) => void;
  recordings: IRecordings;
  currentRecordingIndex: number;
}

export const RecordingStrip = ({ isRecording, onNewRecording, recordings, currentRecordingIndex, onSelectRecording }: Props) => {
  const recordingsRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

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
      recordingsRef.current.scrollBy({ left: -48, behavior: "smooth" });
      setTimeout(checkScrollability, 300);
    }
  };

  const handleScrollRight = () => {
    if (recordingsRef.current?.scrollBy) {
      recordingsRef.current.scrollBy({ left: 48, behavior: "smooth" });
      setTimeout(checkScrollability, 300);
    }
  };

  return (
    <div className={css.recordingStrip}>
      <button className={css.leftButton} disabled={!canScrollLeft || isRecording} onClick={handleScrollLeft}>
        <ArrowIcon className={css.leftArrow} />
      </button>
      <div className={css.recordings} ref={recordingsRef} onScroll={checkScrollability}>
        {recordings.map((recording, index) => {
          const style: CSSProperties = recording.thumbnail ? {
            backgroundImage: `url(${recording.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          } : {};
          return (
            <button
              key={index}
              className={classNames(css.recordingButton, { [css.currentRecordingButton]: index === currentRecordingIndex })}
              onClick={() => onSelectRecording(index)}
              disabled={isRecording && index !== currentRecordingIndex}
              style={style}
            >
              <span className={classNames(css.recordingIndex, { [css.currentRecording]: index === currentRecordingIndex })}>
                {index + 1}
              </span>
            </button>
          );
        })}
        <button className={css.newRecordingButton} onClick={onNewRecording} disabled={isRecording}>
          <AddNewIcon className={css.buttonIcon} />
          <span className={css.newRecordingLabel}>New</span>
        </button>
      </div>
      <button className={css.rightButton} disabled={!canScrollRight || isRecording} onClick={handleScrollRight}>
        <ArrowIcon className={css.rightArrow} />
      </button>
    </div>
  );
};