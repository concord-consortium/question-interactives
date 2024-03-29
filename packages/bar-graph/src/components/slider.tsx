import React, { useCallback, useEffect, useRef } from "react";
import { IRenderedBar } from "../plugins/chart-info";
import { StartChartTabIndex } from "./bar-chart";

import css from "./slider.scss";

export type SliderChangeCallbackOptions = {via: "keyboard"|"mouse", key?: string, delta?: boolean, skipLog?: boolean}
export type SliderChangeCallback = (renderedBar: IRenderedBar, newValue: number, options: SliderChangeCallbackOptions) => void;

interface IProps {
  renderedBar: IRenderedBar;
  top: number;
  bottom: number;
  max: number;
  handleSliderChange: SliderChangeCallback;
}

export const Slider = ({renderedBar, top, bottom, max, handleSliderChange}: IProps) => {
  const {index} = renderedBar;
  const style: React.CSSProperties = {
    top: renderedBar.top - SliderIconHalfHeight,
    left: renderedBar.center - SliderIconHalfWidth,
    width: SliderIconHalfWidth * 2,
    height: SliderIconHalfHeight * 2,
  };
  const tabIndex = StartChartTabIndex + 1 + (2* index);
  const ref = useRef<HTMLDivElement|null>(null);

  const handleMouseDownOrTouchStart = useCallback((e: MouseEvent|TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const mouseE = e as MouseEvent;
    const touchE = e as TouchEvent;

    let logValue: number|undefined = undefined;
    const startY = renderedBar.top;
    const startClientY = touchE.touches && touchE.touches[0] ? touchE.touches[0].clientY : mouseE.clientY;

    const handleMouseOrTouchMove = (moveOrTouchEvent: MouseEvent|TouchEvent) => {
      moveOrTouchEvent.preventDefault();
      moveOrTouchEvent.stopPropagation();

      const mouseMoveE = moveOrTouchEvent as MouseEvent;
      const touchMoveE = moveOrTouchEvent as TouchEvent;
      const clientY = touchMoveE.touches && touchMoveE.touches[0] ? touchMoveE.touches[0].clientY : mouseMoveE.clientY;
      const delta = clientY - startClientY;
      const newY = Math.max(top, Math.min(startY + delta, bottom));
      const newValue = max - (max * ((newY - top) / (bottom - top)));
      handleSliderChange(renderedBar, newValue, {via: "mouse", skipLog: true});
      logValue = newValue;
    };
    const handleMouseUpOrTouchEnd = (upOrTouchEvent: MouseEvent|TouchEvent) => {
      upOrTouchEvent.preventDefault();
      upOrTouchEvent.stopPropagation();

      if (logValue !== undefined) {
        handleSliderChange(renderedBar, logValue, {via: "mouse"});
      }
      window.removeEventListener("mousemove", handleMouseOrTouchMove);
      window.removeEventListener("mouseup", handleMouseUpOrTouchEnd);
      window.removeEventListener("touchmove", handleMouseOrTouchMove);
      window.removeEventListener("touchend", handleMouseUpOrTouchEnd);
    };

    window.addEventListener("mousemove", handleMouseOrTouchMove, {passive: false});
    window.addEventListener("mouseup", handleMouseUpOrTouchEnd, {passive: false});
    window.addEventListener("touchmove", handleMouseOrTouchMove, {passive: false});
    window.addEventListener("touchend", handleMouseUpOrTouchEnd, {passive: false});
  }, [renderedBar, top, bottom, max, handleSliderChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let captureKey = true;

    const options: SliderChangeCallbackOptions = {via: "keyboard", key: e.key};
    switch (e.key) {
      case "ArrowUp":
        handleSliderChange(renderedBar, 1, {...options, delta: true});
        break;
      case "ArrowDown":
        handleSliderChange(renderedBar, -1, {...options, delta: true});
        break;
      case "Home":
        handleSliderChange(renderedBar, 0, options);
        break;
      case "End":
        handleSliderChange(renderedBar, max, options);
        break;
      case "PageUp":
        handleSliderChange(renderedBar, 10, {...options, delta: true});
        break;
      case "PageDown":
        handleSliderChange(renderedBar, -10, {...options, delta: true});
        break;
      default:
        captureKey = false;
        break;
    }

    if (captureKey) {
      e.preventDefault();
    }
  }, [max, renderedBar, handleSliderChange]);

  // add the mouse/touch handlers manually so we can pass {passive: false} and cancel the initial
  // touchstart so that the background doesn't scroll as the sliders are moved
  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener("mousedown", handleMouseDownOrTouchStart, {passive: false});
      ref.current.addEventListener("touchstart", handleMouseDownOrTouchStart, {passive: false});

      // ensure that we remove the event listener from the same element
      const savedRef = ref.current;
      return () => {
        if (savedRef) {
          savedRef.removeEventListener("mousedown", handleMouseDownOrTouchStart);
          savedRef.removeEventListener("touchstart", handleMouseDownOrTouchStart);
        }
      };
    }
  }, [handleMouseDownOrTouchStart]);

  return (
    <div
      ref={ref}
      className={css.slider}
      style={style}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={renderedBar.value}
      data-cy={`slider${renderedBar.index}`}
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

