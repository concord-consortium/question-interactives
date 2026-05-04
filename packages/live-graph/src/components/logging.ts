import { log } from "@concord-consortium/lara-interactive-api";

export const logToggleSeries = (data: { column: string; label: string; visible: boolean }) => {
  log("toggle-series", data);
};

export const logRecordingStarted = (data: { cols: string[] }) => {
  log("recording-started", data);
};

export const logRecordingStopped = () => {
  log("recording-stopped", {});
};

export const logXAxisCompressed = () => {
  log("x-axis-compressed", {});
};

export const logXAxisColumnMissing = (data: { expectedColumn: string; publishedColumns: string[] }) => {
  log("x-axis-column-missing", data);
};

export const logSimulationStarted = (data: { cols: string[] }) => {
  log("simulation-started", data);
};

export const logSimulationPaused = () => {
  log("simulation-paused", {});
};

export const logSimulationReset = () => {
  log("simulation-reset", {});
};

export const logRecordingSelected = (data: { objectId: string | null; status: string; title: string }) => {
  log("recording-selected", data);
};

export const logRecordingDeselected = () => {
  log("recording-deselected", {});
};
