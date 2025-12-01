export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.0;
export const ZOOM_STEP = 0.25;
export const ZOOM_DEFAULT = 1.0;
export const ZOOM_ANIMATION_DURATION = 200; //milliseconds

export const SIM_SPEED_STEPS = { "0.5": 0.5, "1": 1, "2": 2 } as const;
export const SIM_SPEED_DEFAULT = SIM_SPEED_STEPS["1"];
