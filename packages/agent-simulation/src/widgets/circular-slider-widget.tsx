import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";

import { IWidgetComponentProps, CircularSliderWidgetData } from "../types/widgets";
import { validateSliderWidgetData } from "../utils/validation-utils";
import { SliderReadout } from "./slider-readout";
import { WidgetError } from "./widget-error";
import { registerWidget } from "./widget-registration";

import css from "./circular-slider-widget.scss";

export const circularSliderWidgetType = "circular-slider";

const SLIDER_SIZE = 70;
const HALF_SLIDER_SIZE = SLIDER_SIZE / 2;
const SLIDER_RADIUS = 18;
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const THUMB_SIZE = 24;
const HALF_THUMB_SIZE = THUMB_SIZE / 2;

interface IPos {
  x: number;
  y: number;
}

// Convert a value in [min, max] to an angle in [0, 2π]
// Angle 0 is at the right (3 o'clock), increases clockwise
// We start at the top (-π/2) and go clockwise
const valueToAngle = (value: number, min: number, max: number): number => {
  const normalized = (value - min) / (max - min); // 0 to 1
  // Start at top (-π/2 or 3π/2) and go clockwise
  const angle = (normalized * TWO_PI - HALF_PI + TWO_PI) % TWO_PI;
  return angle;
};

// Convert an angle in [0, 2π] to a value in [min, max]
const angleToValue = (angle: number, min: number, max: number): number => {
  // Adjust angle so that top (3π/2 or -π/2) is 0
  const adjustedAngle = (angle + HALF_PI + TWO_PI) % TWO_PI;
  const normalized = adjustedAngle / TWO_PI; // 0 to 1
  return min + normalized * (max - min);
};

// Normalize angle between 0 and 2π
const normalizeAngle = (angle: number) => ((angle % TWO_PI) + TWO_PI) % TWO_PI;

// Get the angle on the circle given a position on the slider
const getCircleAngle = (pos: IPos) => normalizeAngle(Math.atan2(pos.y - HALF_SLIDER_SIZE, pos.x - HALF_SLIDER_SIZE));

// Get the position on the circle given an angle
const getCirclePos = (angle: number, sliderRadius: number): IPos => {
  const x = HALF_SLIDER_SIZE + sliderRadius * Math.cos(angle);
  const y = HALF_SLIDER_SIZE + sliderRadius * Math.sin(angle);
  return { x, y };
};

// Snap value to step if step is defined
const snapToStep = (value: number, min: number, max: number, step?: number): number => {
  if (step === undefined || step <= 0) {
    return value;
  }

  const snapped = Math.round((value - min) / step) * step + min;
  return Math.max(min, Math.min(max, snapped));
};

export const CircularSliderWidget = observer(function CircularSliderWidget(props: IWidgetComponentProps<CircularSliderWidgetData>) {
  const { data, globalKey, isCompletedRecording, inRecordingMode, isRecording, sim } = props;
  const min = data?.min ?? 0;
  const max = data?.max ?? 100;
  const step = data?.step;
  const label = data?.label ?? "";
  const showReadout = data?.showReadout ?? false;
  const formatType = data?.formatType;
  const value = sim.globals.get(globalKey) ?? min;
  const [thumbAngle, setThumbAngle] = useState(() => valueToAngle(value, min, max));
  const sliderRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const boundsRef = useRef<IPos | null>(null);

  // Sync thumb angle when external value changes
  useEffect(() => {
    if (!dragging) {
      setThumbAngle(valueToAngle(value, min, max));
    }
  }, [value, min, max, dragging]);

  const getBounds = useCallback(() => {
    if (!boundsRef.current && sliderRef.current) {
      const { x, y } = sliderRef.current.getBoundingClientRect();
      boundsRef.current = { x, y };
    }
    return boundsRef.current;
  }, []);

  const thumbPos = useMemo(() => {
    return getCirclePos(thumbAngle, SLIDER_RADIUS);
  }, [thumbAngle]);

  const handleValueChange = useCallback(
    (newValue: number) => {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      const snappedValue = snapToStep(clampedValue, min, max, step);
      sim.globals.set(globalKey, snappedValue);
    },
    [sim, globalKey, min, max, step]
  );

  const handleMouseDownOrTouchStart = useCallback((eDown: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isRecording || isCompletedRecording) return;

    eDown.preventDefault();
    eDown.stopPropagation();

    const isMouseEvent = eDown.nativeEvent instanceof MouseEvent;
    boundsRef.current = null;
    const bounds = getBounds();

    if (bounds) {
      const getPosInSlider = (
        ePos: MouseEvent | TouchEvent | React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
      ): IPos | undefined => {
        const pos = ePos as any;
        if (pos.touches !== undefined) {
          if (pos.touches.length > 0) {
            return {
              x: pos.touches[0].clientX - bounds.x,
              y: pos.touches[0].clientY - bounds.y,
            };
          }
          return undefined;
        } else {
          return {
            x: pos.clientX - bounds.x,
            y: pos.clientY - bounds.y,
          };
        }
      };

      const startPos = getPosInSlider(eDown);
      if (startPos !== undefined) {
        const angle = getCircleAngle(startPos);
        setThumbAngle(angle);
      }

      const handleMove = (eMove: MouseEvent | TouchEvent) => {
        eMove.preventDefault();
        eMove.stopPropagation();
        const pos = getPosInSlider(eMove);
        if (pos !== undefined) {
          const angle = getCircleAngle(pos);
          setThumbAngle(angle);
        }
      };

      const handleUp = (eUp: MouseEvent | TouchEvent) => {
        eUp.preventDefault();
        eUp.stopPropagation();

        // Get final position and update value
        const pos = getPosInSlider(eUp);
        if (pos !== undefined) {
          const finalAngle = getCircleAngle(pos);
          const newValue = angleToValue(finalAngle, min, max);
          handleValueChange(newValue);
        } else {
          // Use current thumb angle if no position available
          const newValue = angleToValue(thumbAngle, min, max);
          handleValueChange(newValue);
        }

        setDragging(false);
        if (isMouseEvent) {
          window.removeEventListener("mousemove", handleMove, true);
          window.removeEventListener("mouseup", handleUp, true);
        } else {
          window.removeEventListener("touchmove", handleMove, true);
          window.removeEventListener("touchend", handleUp, true);
        }
      };

      setDragging(true);

      if (isMouseEvent) {
        window.addEventListener("mousemove", handleMove, true);
        window.addEventListener("mouseup", handleUp, true);
      } else {
        window.addEventListener("touchmove", handleMove, true);
        window.addEventListener("touchend", handleUp, true);
      }
    }
  }, [getBounds, min, max, handleValueChange, thumbAngle, isRecording, isCompletedRecording]);

  const handleSliderThumbnailKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isRecording || isCompletedRecording) return;

    const key = e.key;
    const stepSize = step ?? (max - min) / 20; // Default to 5% of range
    const delta =
      key === "ArrowDown" || key === "ArrowLeft"
        ? -stepSize
        : key === "ArrowUp" || key === "ArrowRight"
          ? stepSize
          : 0;

    if (delta !== 0) {
      const newValue = value + delta;
      handleValueChange(newValue);
      e.preventDefault();
      e.stopPropagation();
    }
  }, [value, handleValueChange, step, min, max, isRecording, isCompletedRecording]);

  const handleInputChange = (newValue: number) => {
    if (isRecording || isCompletedRecording) return;
    if (!isNaN(newValue)) {
      handleValueChange(newValue);
    }
  };

  if (!data) {
    return <WidgetError message="Circular slider widget is missing data configuration." />;
  }

  const globalValue = sim.globals.get(globalKey);
  const error = validateSliderWidgetData(data, globalValue, "Circular slider widget");
  if (error) return <WidgetError message={error} />;

  const thumbStyle: React.CSSProperties = {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    left: thumbPos.x - HALF_THUMB_SIZE,
    top: thumbPos.y - HALF_THUMB_SIZE,
  };

  const containerClasses = classNames(
    css.circularSliderWidget,
    {
      [css.recording]: isRecording,
      [css.completedRecording]: isCompletedRecording,
      [css.inRecordingMode]: inRecordingMode
    }
  );

  return (
    <div className={containerClasses} data-testid="circular-slider">
      <div className={css.sliderHeader}>
        <div className={css.labelText} data-testid="circular-slider-label">
          {label}
        </div>
        {showReadout &&
          <div className={css.readoutContainer}>
            <SliderReadout 
              formatType={formatType}
              isCompletedRecording={isCompletedRecording}
              inRecordingMode={inRecordingMode}
              isRecording={isRecording}
              min={min}
              max={max}
              onChange={handleInputChange}
              precision={data.precision}
              step={step}
              unit={data.unit}
              value={value}
            />
          </div>
        }
      </div>
      <div
        className={classNames(css.sliderContainer, { [css.dragging]: dragging })}
        data-testid="circular-slider-container"
      >
        <div className={css.sliderInner}>
          <div
            className={css.slider}
            onMouseDown={handleMouseDownOrTouchStart}
            onTouchStart={handleMouseDownOrTouchStart}
          >
            <div className={css.sliderThumbContainer}>
              <div
                className={css.thumb}
                style={thumbStyle}
                tabIndex={0}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                onKeyDown={handleSliderThumbnailKeyDown}
              />
              <svg width={SLIDER_SIZE} height={SLIDER_SIZE} ref={sliderRef}>
                <circle
                  className={css.sliderCircle}
                  cx={HALF_SLIDER_SIZE}
                  cy={HALF_SLIDER_SIZE}
                  r={SLIDER_RADIUS}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

registerWidget({
  component: CircularSliderWidget,
  size: "tall",
  type: circularSliderWidgetType,
});
