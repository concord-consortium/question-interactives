import React from "react";
import classNames from "classnames";

import { IRecording } from "./types";
import { SIM_SPEED_STEPS } from "../constants";

import PauseIcon from "../assets/pause-icon.svg";
import PlayIcon from "../assets/run-icon.svg";
import ResetIcon from "../assets/rewind-to-start-icon.svg";
import UpdateCodeIcon from "../assets/update-code-icon.svg";
import RecordIcon from "../assets/record-icon.svg";
import StopIcon from "../assets/stop-icon.svg";
import DeleteRecordingIcon from "../assets/delete-recording-icon.svg";

import css from "./control-panel.scss";

interface IProps {
  codeUpdateAvailable: boolean;
  hasCodeSource: boolean;
  paused: boolean;
  currentRecording: IRecording | undefined;
  simSpeed: number;
  onChangeSimSpeed: (newSpeed: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onUpdateCode: () => void;
  onDeleteRecording: () => void;
  canPlay: boolean;
  canReset: boolean;
}

export const ControlPanel = ({
  codeUpdateAvailable,
  hasCodeSource,
  paused,
  currentRecording,
  simSpeed,
  onChangeSimSpeed,
  onPlayPause,
  onReset,
  onUpdateCode,
  onDeleteRecording,
  canPlay,
  canReset
}: IProps) => {

  const recording = !!currentRecording;
  const recorded = !!currentRecording?.objectId;

  const renderPlayPauseButton = () => {
    let label = paused ? "Play" : "Pause";
    let Icon: typeof RecordIcon = paused ? PlayIcon : PauseIcon;
    let disabled = !canPlay;
    const className = classNames({
      [css.paused]: paused,
      [css.playing]: !paused,
      [css.recording]: recording
    });

    if (currentRecording) {
      Icon = paused ? RecordIcon : StopIcon;
      label = paused ? "Record" : "Stop";
      disabled = !canPlay || recorded;
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
        disabled={!canReset || recorded || recording}
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
      <div className={css.simSpeedControl}>
        <label htmlFor="sim-speed-select">Model Speed</label>
        <select
          data-testid="sim-speed-select"
          id="sim-speed-select"
          value={simSpeed}
          onChange={(e) => onChangeSimSpeed(Number(e.target.value))}
        >
          {Object.entries(SIM_SPEED_STEPS)
            .sort(([, a], [, b]) => a - b)
            .map(([label, value]) => (
              <option key={label} value={value}>
                {label}x
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
