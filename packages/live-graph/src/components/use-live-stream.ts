import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createPubSubChannel } from "@concord-consortium/lara-interactive-api";
import { useObjectStorage } from "@concord-consortium/object-storage";
import { IAuthoredState } from "./types";
import { parseColumnDisplayNames } from "./parse-column-display-names";
import { parseColumnFilter } from "./parse-column-filter";
import {
  logRecordingStarted, logRecordingStopped, logRecordingSelected,
  logRecordingDeselected, logSimulationStarted, logSimulationPaused,
  logSimulationReset, logXAxisColumnMissing,
} from "./logging";

export type ViewState =
  | "no-source"
  | "waiting"
  | "plotting"
  | "filter-empty"
  | "x-axis-missing";

export interface IActiveColumn {
  column: string;
  label: string;
}

export interface ILiveStreamResult {
  viewState: ViewState;
  activeColumns: IActiveColumn[];
  cols: string[] | null;
  rows: (number | null)[][];
  updatedAt: number;
  publishedColumns: string[];
  expectedXAxisColumn?: string;
  filterMode: "all" | "allow" | "ignore";
  filterEntries: string[];
  unmatchedFilterEntries: string[];
  recordingEpoch: number;
  activityState: ActivityState;
  sourceTitle: string;
  statusMessage: string;
}

const isMissingId = (value: string | null | undefined): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "none";
};

const normalizeId = (value: string | null | undefined): string | null => {
  if (isMissingId(value)) {
    return null;
  }
  return (value as string).trim();
};

const coerceToFiniteOrNull = (v: unknown): number | null => {
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }
  if (typeof v === "string") {
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const deriveActiveColumns = (
  cols: string[],
  authoredState: IAuthoredState,
  displayNames: Record<string, string>,
  allowList: string[],
  ignoreList: string[]
): IActiveColumn[] => {
  let names = cols.slice();
  const xCol = authoredState.xAxisColumn?.trim();
  if (xCol) {
    names = names.filter(n => n !== xCol);
  }
  const mode = authoredState.columnFilteringMode ?? "all";
  if (mode === "allow") {
    const allowSet = new Set(allowList);
    names = names.filter(n => allowSet.has(n));
  } else if (mode === "ignore") {
    const ignoreSet = new Set(ignoreList);
    names = names.filter(n => !ignoreSet.has(n));
  }
  return names.map(n => ({
    column: n,
    label: displayNames[n] ?? n,
  }));
};

// Combines the three state values that the PubSub subscribe callback updates
// into a single dispatch so React 17 (which does not auto-batch outside event
// handlers) triggers exactly one re-render per message.
interface IStreamState {
  updatedAt: number;
  recordingEpoch: number;
  unmatchedFilterEntries: string[];
  activityState: ActivityState;
  sourceTitle: string;
  statusMessage: string;
}

export type ActivityState = "idle" | "playing" | "paused" | "recording" | "stopped" | "recorded";

type StreamAction =
  | { type: "tick" }
  | { type: "source-started"; unmatchedFilterEntries: string[]; activityState: ActivityState; sourceTitle: string }
  | { type: "activity-changed"; activityState: ActivityState; sourceTitle?: string }
  | { type: "status-message"; message: string }
  | { type: "data-loaded"; unmatchedFilterEntries: string[] };

const streamReducer = (state: IStreamState, action: StreamAction): IStreamState => {
  switch (action.type) {
    case "tick":
      return { ...state, updatedAt: state.updatedAt + 1 };
    case "source-started":
      return {
        updatedAt: state.updatedAt + 1,
        recordingEpoch: state.recordingEpoch + 1,
        unmatchedFilterEntries: action.unmatchedFilterEntries,
        activityState: action.activityState,
        sourceTitle: action.sourceTitle,
        statusMessage: "",
      };
    case "activity-changed":
      return {
        ...state,
        updatedAt: state.updatedAt + 1,
        activityState: action.activityState,
        ...(action.sourceTitle !== undefined ? { sourceTitle: action.sourceTitle } : {}),
      };
    case "status-message":
      return { ...state, statusMessage: action.message };
    case "data-loaded":
      return {
        ...state,
        updatedAt: state.updatedAt + 1,
        unmatchedFilterEntries: action.unmatchedFilterEntries,
        statusMessage: "",
      };
    default:
      return state;
  }
};

export const useLiveStream = (
  authoredState: IAuthoredState,
  linkedInteractiveId: string | undefined
): ILiveStreamResult => {
  // Lock to the first valid (non-null/non-"none") linked interactive ID.
  // Uses a ref so mid-session prop changes are ignored (iframe reload required).
  // An effect captures the first non-null value to handle hosts that deliver
  // the init message asynchronously (undefined on first render, real ID later).
  const lockedIdRef = useRef<string | null>(normalizeId(linkedInteractiveId));
  const [lockedId, setLockedId] = useState<string | null>(lockedIdRef.current);
  useEffect(() => {
    if (lockedIdRef.current === null) {
      const candidate = normalizeId(linkedInteractiveId);
      if (candidate !== null) {
        lockedIdRef.current = candidate;
        setLockedId(candidate);
      }
    }
  }, [linkedInteractiveId]);

  const colsRef = useRef<string[] | null>(null);
  const rowsRef = useRef<(number | null)[][]>([]);

  const [streamState, dispatch] = useReducer(streamReducer, {
    updatedAt: 0,
    recordingEpoch: 0,
    unmatchedFilterEntries: [],
    activityState: "idle" as ActivityState,
    sourceTitle: "",
    statusMessage: "",
  });

  const dispatchTick = useCallback(() => dispatch({ type: "tick" }), []);

  // Keep the latest authoredState, allowList, and ignoreList accessible from inside
  // the subscribe callback without re-subscribing on every prop change.
  const displayNames = useMemo(
    () => parseColumnDisplayNames(authoredState.columnDisplayNames),
    [authoredState.columnDisplayNames]
  );
  const allowList = useMemo(
    () => parseColumnFilter(authoredState.allowList),
    [authoredState.allowList]
  );
  const ignoreList = useMemo(
    () => parseColumnFilter(authoredState.ignoreList),
    [authoredState.ignoreList]
  );

  const latestAuthoredStateRef = useRef(authoredState);
  latestAuthoredStateRef.current = authoredState;
  const latestAllowListRef = useRef(allowList);
  latestAllowListRef.current = allowList;
  const latestIgnoreListRef = useRef(ignoreList);
  latestIgnoreListRef.current = ignoreList;

  const objectStorage = useObjectStorage();
  const objectStorageRef = useRef(objectStorage);
  objectStorageRef.current = objectStorage;
  const fetchEpochRef = useRef(0);
  const activityStateRef = useRef<ActivityState>("idle");
  activityStateRef.current = streamState.activityState;

  const fetchRecordingData = useCallback(async (objectId: string, epoch: number) => {
    try {
      const os = objectStorageRef.current;

      const metadata = await os.readMetadata(objectId);
      if (!metadata) {
        throw new Error(`Object ${objectId} not found`);
      }

      const dataTableEntry = Object.entries(metadata.items)
        .find(([, item]: [string, any]) => item.type === "dataTable");
      if (!dataTableEntry) {
        throw new Error(`No dataTable found in object ${objectId}`);
      }
      const [dataTableId, dataTableMetadata] = dataTableEntry as [string, any];

      const dataTableData = await os.readDataItem(objectId, dataTableId);
      if (!dataTableData) {
        throw new Error(`Failed to read data table ${dataTableId}`);
      }

      if (fetchEpochRef.current !== epoch) {
        return;
      }

      const fetchedCols = dataTableMetadata.cols as string[];
      const fetchedRows = Object.values(dataTableData.rows || {}).map((row: any) => row) as (number | null)[][];

      colsRef.current = fetchedCols;
      rowsRef.current = fetchedRows;

      const activeMode = latestAuthoredStateRef.current.columnFilteringMode ?? "all";
      const entries = activeMode === "allow" ? latestAllowListRef.current
        : activeMode === "ignore" ? latestIgnoreListRef.current : [];
      const unmatched = entries.filter(e => !fetchedCols.includes(e));

      dispatch({ type: "data-loaded", unmatchedFilterEntries: unmatched });
    } catch (err) {
      console.error("[live-graph] Failed to fetch recording data:", err);
      dispatch({ type: "status-message", message: "Unable to load recording data." });
      dispatch({ type: "activity-changed", activityState: "idle" });
    }
  }, []);

  useEffect(() => {
    const id = lockedIdRef.current;
    if (!id) {
      return;
    }
    const channel = createPubSubChannel(id);
    const unsubscribe = channel.subscribe((message: any) => {
      switch (message?.topic) {
        case "recording-started":
        case "simulation-started": {
          fetchEpochRef.current++;
          const newCols: string[] = Array.isArray(message.cols) ? message.cols : [];
          colsRef.current = newCols;
          rowsRef.current = [];

          const activeMode = latestAuthoredStateRef.current.columnFilteringMode ?? "all";
          const entries = activeMode === "allow" ? latestAllowListRef.current
            : activeMode === "ignore" ? latestIgnoreListRef.current : [];
          const unmatched = entries.filter(e => !newCols.includes(e));

          if (message.topic === "recording-started") {
            logRecordingStarted({ cols: newCols });
          } else {
            logSimulationStarted({ cols: newCols });
          }

          if (unmatched.length > 0) {
            console.error(
              `[live-graph] Unmatched ${activeMode} filter entries:`,
              unmatched,
              "Published columns:", newCols
            );
          }

          dispatch({
            type: "source-started",
            unmatchedFilterEntries: unmatched,
            activityState: message.topic === "recording-started" ? "recording" : "playing",
            sourceTitle: message.title ?? "",
          });
          break;
        }
        case "recording-tick":
        case "simulation-tick": {
          const currentCols = colsRef.current;
          if (!currentCols) {
            return;
          }
          const expectedXCol = latestAuthoredStateRef.current.xAxisColumn?.trim();
          if (expectedXCol && !currentCols.includes(expectedXCol)) {
            return;
          }
          const values = message.values ?? {};
          const row = currentCols.map(col => coerceToFiniteOrNull(values[col]));
          rowsRef.current.push(row);
          if (activityStateRef.current === "paused") {
            dispatch({ type: "activity-changed", activityState: "playing" });
          }
          dispatchTick();
          break;
        }
        case "recording-stopped": {
          logRecordingStopped();
          dispatch({ type: "activity-changed", activityState: "stopped" });
          break;
        }
        case "simulation-paused": {
          logSimulationPaused();
          dispatch({ type: "activity-changed", activityState: "paused" });
          break;
        }
        case "simulation-reset": {
          colsRef.current = null;
          rowsRef.current = [];
          logSimulationReset();
          dispatch({ type: "source-started", unmatchedFilterEntries: [], activityState: "idle", sourceTitle: "" });
          break;
        }
        case "recording-selected": {
          const { objectId, title, status } = message;
          const sourceTitle = title ?? "";
          fetchEpochRef.current++;

          logRecordingSelected({ objectId: objectId ?? null, status: status ?? "ready", title: sourceTitle });

          colsRef.current = null;
          rowsRef.current = [];
          const isFailed = status === "failed";
          dispatch({
            type: "source-started",
            unmatchedFilterEntries: [],
            activityState: isFailed ? "idle" : "recorded",
            sourceTitle: isFailed ? "" : sourceTitle,
          });

          switch (status) {
            case "empty":
              dispatch({ type: "status-message", message: "No recording data yet." });
              break;
            case "waiting":
              dispatch({ type: "status-message", message: "Saving recording..." });
              break;
            case "ready":
              dispatch({ type: "status-message", message: "Loading recording..." });
              fetchRecordingData(objectId, fetchEpochRef.current);
              break;
            case "failed":
              dispatch({ type: "status-message", message: "Recording data is not available yet." });
              console.error("[live-graph] Recording data fetch failed", { objectId, status });
              break;
          }
          break;
        }
        case "recording-deselected": {
          colsRef.current = null;
          rowsRef.current = [];
          logRecordingDeselected();
          dispatch({ type: "source-started", unmatchedFilterEntries: [], activityState: "idle", sourceTitle: "" });
          break;
        }
      }
    });
    return () => {
      unsubscribe();
      channel.dispose();
    };
  }, [dispatchTick, lockedId, fetchRecordingData]);

  const cols = colsRef.current;
  const rows = rowsRef.current;
  const publishedColumns = useMemo(() => cols ?? [], [cols]);

  const activeColumns = useMemo(
    () =>
      cols ? deriveActiveColumns(cols, authoredState, displayNames, allowList, ignoreList) : [],
    [
      cols,
      authoredState,
      displayNames,
      allowList,
      ignoreList,
    ]
  );

  let viewState: ViewState;
  if (!lockedIdRef.current) {
    viewState = "no-source";
  } else if (!cols) {
    viewState = "waiting";
  } else {
    const expectedXCol = authoredState.xAxisColumn?.trim();
    if (expectedXCol && !cols.includes(expectedXCol)) {
      viewState = "x-axis-missing";
    } else {
      viewState = activeColumns.length === 0 ? "filter-empty" : "plotting";
    }
  }

  // viewState transition gate — fire logs/console.error exactly once per transition.
  const prevViewStateRef = useRef<ViewState | null>(null);
  useEffect(() => {
    const prev = prevViewStateRef.current;
    if (prev !== viewState) {
      if (viewState === "x-axis-missing") {
        const expectedXCol = authoredState.xAxisColumn?.trim() || "";
        logXAxisColumnMissing({ expectedColumn: expectedXCol, publishedColumns });
        console.error(`[live-graph] X-axis column "${expectedXCol}" not found in published columns:`, publishedColumns);
      }
      if (viewState === "filter-empty") {
        const filterMode2 = authoredState.columnFilteringMode ?? "all";
        console.error(`[live-graph] After ${filterMode2} filtering, no columns remain. Published:`, publishedColumns);
      }
      prevViewStateRef.current = viewState;
    }
  }, [viewState, authoredState, publishedColumns]);

  const mode = authoredState.columnFilteringMode ?? "all";
  const filterEntries = mode === "allow" ? allowList : mode === "ignore" ? ignoreList : [];

  return {
    viewState,
    activeColumns,
    cols,
    rows,
    updatedAt: streamState.updatedAt,
    publishedColumns,
    expectedXAxisColumn: authoredState.xAxisColumn?.trim() || undefined,
    filterMode: mode,
    filterEntries,
    unmatchedFilterEntries: streamState.unmatchedFilterEntries,
    recordingEpoch: streamState.recordingEpoch,
    activityState: streamState.activityState,
    sourceTitle: streamState.sourceTitle,
    statusMessage: streamState.statusMessage,
  };
};
