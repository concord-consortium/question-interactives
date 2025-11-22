import React from "react";
import { SIM_SPEED_STEPS } from "../constants";

import PauseIcon from "../assets/pause-icon.svg";
import PlayIcon from "../assets/run-icon.svg";
import ResetIcon from "../assets/rewind-to-start-icon.svg";
import UpdateCodeIcon from "../assets/update-code-icon.svg";

import css from "./control-panel.scss";

interface IProps {
  codeUpdateAvailable: boolean;
  hasBeenStarted: boolean;
  hasCodeSource: boolean;
  paused: boolean;
  simSpeed: number;
  onChangeSimSpeed: (newSpeed: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onUpdateCode: () => void;
}

export const ControlPanel = ({
  codeUpdateAvailable,
  hasBeenStarted,
  hasCodeSource,
  paused,
  simSpeed,
  onChangeSimSpeed,
  onPlayPause,
  onReset,
  onUpdateCode,
}: IProps) => {
  return (
    <div className={`${css.controlPanel} ${css.actionControls}`}>
      {hasCodeSource && (
        <button
          aria-label="Update Code"
          className={css.updateButton}
          data-testid="update-code-button"
          disabled={!codeUpdateAvailable}
          title="Update Code"
          onClick={onUpdateCode}
        >
          <UpdateCodeIcon className={css.buttonIcon} />
        </button>
      )}
      <button
        aria-label={paused ? "Play" : "Pause"}
        className={`${css.playPauseButton} ${paused ? css.paused : css.playing}`}
        data-testid="play-pause-button"
        title={paused ? "Play" : "Pause"}
        onClick={onPlayPause}
      >
        {paused ? <PlayIcon className={css.buttonIcon} /> : <PauseIcon className={css.buttonIcon} />}
      </button>
      <button
        aria-label="Reset"
        className={css.resetButton}
        data-testid="reset-button"
        disabled={!hasBeenStarted}
        title="Reset"
        onClick={onReset}
      >
        <ResetIcon className={css.buttonIcon} />
      </button>
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
