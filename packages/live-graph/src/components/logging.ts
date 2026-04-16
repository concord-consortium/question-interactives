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
