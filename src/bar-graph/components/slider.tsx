import React, { useCallback } from "react";
import { IRenderedBar } from "../plugins/chart-info";

import css from "./slider.scss";

interface IProps {
  renderedBar: IRenderedBar;
  top: number;
  bottom: number;
  max: number;
  handleSliderChange: (renderedBar: IRenderedBar, newValue: number, options?: {delta: boolean}) => void;
}

export const Slider = ({renderedBar, top, bottom, max, handleSliderChange}: IProps) => {
  const {index} = renderedBar;
  const style: React.CSSProperties = {
    top: renderedBar.top - SliderIconHalfHeight,
    left: renderedBar.center - SliderIconHalfWidth,
    width: SliderIconHalfWidth * 2,
    height: SliderIconHalfHeight * 2,
  };
  const tabIndex = 2 + (2* index);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    const startY = renderedBar.top;
    const startClientY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startClientY;
      const newY = Math.max(top, Math.min(startY + delta, bottom));
      const newValue = max - (max * ((newY - top) / (bottom - top)));
      handleSliderChange(renderedBar, newValue);
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [renderedBar, top, bottom, max, handleSliderChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        handleSliderChange(renderedBar, 1, {delta: true});
        break;
      case "ArrowDown":
        handleSliderChange(renderedBar, -1, {delta: true});
        break;
      case "Home":
        handleSliderChange(renderedBar, 0);
        break;
      case "End":
        handleSliderChange(renderedBar, max);
        break;
      case "PageUp":
        handleSliderChange(renderedBar, 10, {delta: true});
        break;
      case "PageDown":
        handleSliderChange(renderedBar, -10, {delta: true});
        break;
    }
  }, [max, renderedBar, handleSliderChange]);

  return (
    <div
      className={css.slider}
      style={style}
      tabIndex={tabIndex}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={renderedBar.value}
    >
      <SliderIcon />
    </div>
  );
};

export const SliderIconHalfHeight = 14;
export const SliderIconHalfWidth = 14;

export const SliderIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 38 38">
      <defs>
        <filter id="jk8sb59w0a" width="140%" height="140%" x="-20%" y="-20%" filterUnits="objectBoundingBox">
          <feOffset in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="2" />
          <feColorMatrix in="shadowBlurOuter1" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0" />
        </filter>
        <path id="beoz3mm3zb" d="M15 0C6.717 0 0 6.717 0 15c0 8.283 6.717 15 15 15 8.283 0 15-6.717 15-15 0-8.283-6.717-15-15-15" />
      </defs>
      <g fill="none" fillRule="evenodd">
        <g>
          <g transform="translate(-744 -1061) translate(744 1061)">
            <g>
              <g transform="rotate(90 15 19)">
                <use fill="#000" filter="url(#jk8sb59w0a)" />
                <use fill="#333" />
              </g>
              <path fill="#FFF" stroke="#000" d="M15 1c7.72 0 14 6.28 14 14s-6.28 14-14 14S1 22.72 1 15 7.28 1 15 1" transform="rotate(90 15 19)" />
              <path fill="#CCC" d="M25.5 15L17.25 7.5 17.25 22.5zM4.5 15L12.75 22.5 12.75 7.5z" transform="rotate(90 15 19)" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};

