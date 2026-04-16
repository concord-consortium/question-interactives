import { log } from "@concord-consortium/lara-interactive-api";
import {
  logToggleSeries,
  logRecordingStarted,
  logRecordingStopped,
  logXAxisCompressed,
  logXAxisColumnMissing,
} from "./logging";

jest.mock("@concord-consortium/lara-interactive-api");

const mockLog = log as jest.Mock;

describe("logging helpers", () => {
  beforeEach(() => {
    mockLog.mockClear();
  });

  it("logToggleSeries", () => {
    logToggleSeries({ column: "a", label: "Alpha", visible: false });
    expect(mockLog).toHaveBeenCalledWith("toggle-series", {
      column: "a",
      label: "Alpha",
      visible: false,
    });
  });

  it("logRecordingStarted", () => {
    logRecordingStarted({ cols: ["a", "b"] });
    expect(mockLog).toHaveBeenCalledWith("recording-started", { cols: ["a", "b"] });
  });

  it("logRecordingStopped", () => {
    logRecordingStopped();
    expect(mockLog).toHaveBeenCalledWith("recording-stopped", {});
  });

  it("logXAxisCompressed", () => {
    logXAxisCompressed();
    expect(mockLog).toHaveBeenCalledWith("x-axis-compressed", {});
  });

  it("logXAxisColumnMissing", () => {
    logXAxisColumnMissing({ expectedColumn: "time", publishedColumns: ["a", "b"] });
    expect(mockLog).toHaveBeenCalledWith("x-axis-column-missing", {
      expectedColumn: "time",
      publishedColumns: ["a", "b"],
    });
  });
});
