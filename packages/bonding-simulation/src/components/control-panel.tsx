import React from "react";

import { SIM_SPEED_STEPS } from "../constants";

import PauseIcon from "../assets/pause-icon.svg";
import PlayIcon from "../assets/run-icon.svg";
import ResetIcon from "../assets/rewind-to-start-icon.svg";

import css from "./control-panel.scss";

interface IProps {
  paused: boolean;
  simSpeed: number;
  onPlayPause: () => void;
  onSetAtoms: () => void;
  onReset: () => void;
  onSpeedChange: (newSpeed: number) => void;
}

export const ControlPanel = ({
  paused,
  simSpeed,
  onPlayPause,
  onSetAtoms,
  onReset,
  onSpeedChange,
}: IProps) => {
  const label = paused ? "Play" : "Pause";
  const Icon = paused ? PlayIcon : PauseIcon;

  return (
    <div className={css.controlPanel}>
      <button
        aria-label="Set Atoms"
        data-testid="set-atoms-button"
        title="Apply slider values"
        onClick={onSetAtoms}
        style={{ fontSize: 11, padding: "4px 8px", minWidth: 60 }}
      >
        Set Atoms
      </button>
      <button
        aria-label={label}
        data-testid="play-pause-button"
        title={label}
        onClick={onPlayPause}
      >
        <Icon className={css.buttonIcon} />
      </button>
      <button
        aria-label="Reset"
        data-testid="reset-button"
        title="Reset"
        onClick={onReset}
      >
        <ResetIcon className={css.buttonIcon} />
      </button>
      <div className={css.simSpeedControl}>
        <label htmlFor="sim-speed-select">Speed</label>
        <select
          data-testid="sim-speed-select"
          id="sim-speed-select"
          value={simSpeed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        >
          {Object.entries(SIM_SPEED_STEPS)
            .sort(([, a], [, b]) => a - b)
            .map(([speedLabel, value]) => (
              <option key={speedLabel} value={value}>
                {speedLabel}x
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
