import React from "react";

import { IRecording } from "./types";

import PauseIcon from "../assets/pause-icon.svg";
import PlayIcon from "../assets/run-icon.svg";
import ResetIcon from "../assets/rewind-to-start-icon.svg";
import UpdateCodeIcon from "../assets/update-code-icon.svg";
import RecordIcon from "../assets/record-icon.svg";
import StopIcon from "../assets/stop-icon.svg";
import DeleteRecordingIcon from "../assets/delete-recording-icon.svg";

import css from "./control-panel.scss";
import classNames from "classnames";

interface IProps {
  codeUpdateAvailable: boolean;
  hasBeenStarted: boolean;
  hasCodeSource: boolean;
  paused: boolean;
  currentRecording: IRecording | undefined;
  onPlayPause: () => void;
  onReset: () => void;
  onUpdateCode: () => void;
  onDeleteRecording: () => void;
}

export const ControlPanel = ({
  codeUpdateAvailable,
  hasBeenStarted,
  hasCodeSource,
  paused,
  currentRecording,
  onPlayPause,
  onReset,
  onUpdateCode,
  onDeleteRecording
}: IProps) => {

  const recording = !!currentRecording;
  const recorded = !!currentRecording?.objectId;

  const renderPlayPauseButton = () => {
    let label = paused ? "Play" : "Pause";
    let Icon: typeof RecordIcon = paused ? PlayIcon : PauseIcon;
    let disabled = false;
    const className = classNames({
      [css.paused]: paused,
      [css.playing]: !paused,
      [css.recording]: recording
    });

    if (currentRecording) {
      Icon = paused ? RecordIcon : StopIcon;
      label = paused ? "Record" : "Stop";
      disabled = recorded;
    }

    return (
      <button
        aria-label={label}
        className={className}
        data-testid="play-pause-button"
        title={label}
        onClick={onPlayPause}
        disabled={disabled}
      >
        <Icon className={css.buttonIcon} />
      </button>
    );
  };

  return (
    <div className={`${css.controlPanel} ${css.actionControls}`}>
      {hasCodeSource && (
        <button
          aria-label="Update Code"
          className={css.updateButton}
          data-testid="update-code-button"
          disabled={!codeUpdateAvailable || recording}
          title="Update Code"
          onClick={onUpdateCode}
        >
          <UpdateCodeIcon className={css.buttonIcon} />
        </button>
      )}
      {renderPlayPauseButton()}
      <button
        aria-label="Reset"
        className={css.resetButton}
        data-testid="reset-button"
        disabled={!hasBeenStarted || recording}
        title="Reset"
        onClick={onReset}
      >
        <ResetIcon className={css.buttonIcon} />
      </button>
      {currentRecording && (
        <button
          aria-label="Delete Recording"
          className={css.deleteRecordingButton}
          data-testid="delete-recording-button"
          title="Delete Recording"
          disabled={!recorded}
          onClick={onDeleteRecording}
        >
          <DeleteRecordingIcon className={css.buttonIcon} />
        </button>
      )}
    </div>
  );
};
