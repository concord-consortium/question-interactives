import React from "react";
import classnames from "classnames";

import { ZOOM_MAX, ZOOM_MIN } from "../constants";

import FitAllIcon from "../assets/fit-all-in-view-icon.svg";
import ZoomInIcon from "../assets/zoom-in-icon.svg";
import ZoomOutIcon from "../assets/zoom-out-icon.svg";

import css from "./zoom-controls.scss";

interface ZoomControlsProps {
  zoomLevel: number;
  onFitAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls = ({ zoomLevel, onFitAll, onZoomIn, onZoomOut }: ZoomControlsProps) => {

  return (
    <div className={css.zoomControls}>
      <button
        aria-label="Fit all in view"
        className={classnames(css.fitAllButton, css.fullOpacity)}
        data-testid="fit-all-in-view-button"
        disabled={zoomLevel === 1}
        title="Fit all in view"
        onClick={onFitAll}
      >
        <FitAllIcon className={css.buttonIcon} />
      </button>
      <button
        aria-label="Zoom in"
        className={classnames(css.zoomInButton, css.fullOpacity)}
        data-testid="zoom-in-button"
        title="Zoom in"
        disabled={zoomLevel >= ZOOM_MAX}
        onClick={onZoomIn}
      >
        <ZoomInIcon className={css.buttonIcon} />
      </button>
      <button
        aria-label="Zoom out"
        className={classnames(css.zoomOutButton, css.fullOpacity)}
        data-testid="zoom-out-button"
        title="Zoom out"
        disabled={zoomLevel <= ZOOM_MIN}
        onClick={onZoomOut}
      >
        <ZoomOutIcon className={css.buttonIcon} />
      </button>
    </div>
  );
};
