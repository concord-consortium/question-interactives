import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PubSubSimulationConfig,
  IColumnConfig,
  createGeneratorState,
} from "./pub-sub-simulation";
import {
  getPubSubManager,
  DEMO_PUBLISHER_ID,
  DEMO_RUNTIME_INTERACTIVE_ID,
} from "./demo";
import { saveOverride, clearOverride, hasOverride } from "./pub-sub-simulation-override";
import { PubSubSimulationConfigModal } from "./pub-sub-simulation-config-modal";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

interface IProps {
  config: PubSubSimulationConfig;
  passedInConfig: PubSubSimulationConfig;
  onConfigChange: (config: PubSubSimulationConfig) => void;
}

export const PubSubSimulationControls: React.FC<IProps> = ({
  config,
  passedInConfig,
  onConfigChange,
}) => {
  const [state, setState] = useState<RecordingState>("idle");
  const [showModal, setShowModal] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const tickIndexRef = useRef(0);
  const genStateRef = useRef(createGeneratorState());

  const isOverridden = useMemo(
    () => hasOverride(config, passedInConfig),
    [config, passedInConfig]
  );

  useEffect(() => {
    if (state !== "recording") {
      return;
    }
    const tickRate = Number.isFinite(config.tickRate) && config.tickRate > 0
      ? config.tickRate
      : 250;

    const interval = setInterval(() => {
      const values: Record<string, number | null> = {};
      for (const col of config.columns) {
        values[col.name] = genStateRef.current.runGenerator(col, tickIndexRef.current, config.customGenerators);
      }
      getPubSubManager().publish(
        DEMO_PUBLISHER_ID,
        DEMO_RUNTIME_INTERACTIVE_ID,
        { topic: "recording-tick", values }
      );
      tickIndexRef.current += 1;
    }, tickRate);

    return () => clearInterval(interval);
  }, [state, config]);

  const handleStart = () => {
    if (state !== "idle") {
      return;
    }
    tickIndexRef.current = 0;
    genStateRef.current.resetEmittedValues();
    getPubSubManager().publish(
      DEMO_PUBLISHER_ID,
      DEMO_RUNTIME_INTERACTIVE_ID,
      { topic: "recording-started", cols: config.columns.map(c => c.name) }
    );
    setState("recording");
  };

  const handlePause = () => {
    if (state !== "recording") {
      return;
    }
    setState("paused");
  };

  const handleContinue = () => {
    if (state !== "paused") {
      return;
    }
    setState("recording");
  };

  const handleStop = () => {
    if (state !== "recording" && state !== "paused") {
      return;
    }
    genStateRef.current.flushNonNumericWarnings();
    getPubSubManager().publish(
      DEMO_PUBLISHER_ID,
      DEMO_RUNTIME_INTERACTIVE_ID,
      { topic: "recording-stopped" }
    );
    setState("stopped");
  };

  const handleReset = () => {
    if (state !== "stopped") {
      return;
    }
    tickIndexRef.current = 0;
    genStateRef.current.resetEmittedValues();
    // Don't publish PubSub messages — the next Start will send
    // recording-started which clears the chart. Avoids phantom
    // recording-started/stopped pairs in log data.
    setState("idle");
  };

  const handleRestart = () => {
    if (state !== "stopped") {
      return;
    }
    tickIndexRef.current = 0;
    genStateRef.current.resetEmittedValues();
    getPubSubManager().publish(
      DEMO_PUBLISHER_ID,
      DEMO_RUNTIME_INTERACTIVE_ID,
      { topic: "recording-started", cols: config.columns.map(c => c.name) }
    );
    setState("recording");
  };

  const editEnabled = state === "idle" || state === "stopped";

  const handleSave = (edited: { columns: IColumnConfig[]; tickRate: number }) => {
    saveOverride(window.location.pathname, edited);
    onConfigChange({
      ...config,
      columns: edited.columns,
      tickRate: edited.tickRate,
    });
    setShowModal(false);
    editButtonRef.current?.focus();
  };

  const handleCancel = () => {
    setShowModal(false);
    editButtonRef.current?.focus();
  };

  const handleResetToDefault = () => {
    clearOverride(window.location.pathname);
    onConfigChange(passedInConfig);
    setShowModal(false);
    editButtonRef.current?.focus();
  };

  return (
    <div style={{ padding: "8px 8px 8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <strong>Live Data: </strong>
        {state === "idle" && <button onClick={handleStart}>Start</button>}
        {state === "recording" && (
          <>
            <button onClick={handlePause}>Pause</button>
            <button onClick={handleStop}>Stop</button>
          </>
        )}
        {state === "paused" && (
          <>
            <button onClick={handleContinue}>Continue</button>
            <button onClick={handleStop}>Stop</button>
          </>
        )}
        {state === "stopped" && (
          <>
            <button onClick={handleReset}>Reset</button>
            <button onClick={handleRestart}>Restart</button>
          </>
        )}
        <span style={{ fontStyle: "italic" }}>{state.charAt(0).toUpperCase() + state.slice(1)}</span>
        <span style={{ marginLeft: "auto" }}>
          <button
            ref={editButtonRef}
            disabled={!editEnabled}
            onClick={() => setShowModal(true)}
            style={!editEnabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            Live Data Settings
          </button>
        </span>
      </div>
      {isOverridden && (
        <div style={{ marginTop: 4, fontSize: 12, fontStyle: "italic" }}>
          Using custom config
        </div>
      )}
      {showModal && (
        <PubSubSimulationConfigModal
          config={config}
          onSave={handleSave}
          onCancel={handleCancel}
          onResetToDefault={handleResetToDefault}
        />
      )}
    </div>
  );
};
