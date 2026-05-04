// NOTE: This modal is used exclusively in the demo/developer tooling and is not
// student-facing. It intentionally omits a keyboard focus trap (WCAG 2.4.3) to
// keep the implementation simple. If this component is ever promoted to a
// student-facing context, a proper focus trap must be added.

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { IColumnConfig, PubSubSimulationConfig } from "./pub-sub-simulation";

interface IColumnConfigWithKey extends IColumnConfig {
  _key: string;
}

let nextKey = 0;
const withKey = (col: IColumnConfig): IColumnConfigWithKey => ({
  ...col,
  _key: `col-${nextKey++}`,
});

const stripKey = (col: IColumnConfigWithKey): IColumnConfig => {
  const { _key, ...rest } = col;
  return rest;
};

interface IProps {
  config: PubSubSimulationConfig;
  onSave: (config: { columns: IColumnConfig[]; tickRate: number }) => void;
  onCancel: () => void;
  onResetToDefault: () => void;
}

const BUILT_IN_GENERATORS = ["sine", "random", "increment", "constant"];

const getGeneratorOptions = (customGenerators?: Record<string, { name: string }>) => {
  const options = BUILT_IN_GENERATORS.map(g => ({ value: g, label: g }));
  if (customGenerators) {
    for (const [slug, gen] of Object.entries(customGenerators)) {
      options.push({ value: slug, label: gen.name });
    }
  }
  return options;
};

export const PubSubSimulationConfigModal: React.FC<IProps> = ({
  config,
  onSave,
  onCancel,
  onResetToDefault,
}) => {
  const [columns, setColumns] = useState<IColumnConfigWithKey[]>(
    config.columns.map(c => withKey(c))
  );
  const [tickRate, setTickRate] = useState(config.tickRate);
  const headingId = "pub-sub-config-heading";
  const firstFocusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const generatorOptions = getGeneratorOptions(config.customGenerators);

  const updateColumn = (index: number, patch: Partial<IColumnConfigWithKey>) => {
    setColumns(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeColumn = (index: number) => {
    setColumns(prev => prev.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    setColumns(prev => [...prev, withKey({ name: "", generator: "constant", value: 0 })]);
  };

  const changeGenerator = (index: number, gen: string) => {
    const base: IColumnConfigWithKey = { _key: columns[index]._key, name: columns[index].name, generator: gen };
    if (gen === "sine") {
      Object.assign(base, { min: 0, max: 1, period: 20, phase: 0 });
    } else if (gen === "random") {
      Object.assign(base, { min: 0, max: 1 });
    } else if (gen === "increment") {
      Object.assign(base, { delta: 1 });
    } else if (gen === "constant") {
      Object.assign(base, { value: 0 });
    }
    setColumns(prev => prev.map((c, i) => (i === index ? base : c)));
  };

  // Validation
  const nameErrors = columns.map((col, i) => {
    const trimmed = col.name.trim();
    if (!trimmed) {
      return "Required";
    }
    const duplicate = columns.some(
      (other, j) => j !== i && other.name.trim() === trimmed
    );
    return duplicate ? "Column name must be unique" : undefined;
  });
  const tickRateValid = Number.isFinite(tickRate) && tickRate > 0;
  const canSave =
    nameErrors.every(e => !e) &&
    tickRateValid &&
    columns.length > 0;

  const handleSave = () => {
    if (canSave) {
      onSave({ columns: columns.map(stripKey), tickRate });
    }
  };

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          maxHeight: "80vh",
          overflowY: "auto",
          minWidth: 500,
          maxWidth: 700,
        }}
      >
        <h2 id={headingId}>Live Data Settings</h2>
        <div style={{ marginBottom: 16 }}>
          <label>
            Tick rate (ms):{" "}
            <input
              ref={firstFocusRef}
              type="number"
              value={tickRate}
              min={1}
              onChange={e => setTickRate(Number(e.target.value))}
              style={{ width: 80 }}
            />
          </label>
          {!tickRateValid && (
            <span style={{ color: "red", marginLeft: 8 }}>Must be a positive number</span>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "8px 6px" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th>Name</th>
              <th>Start</th>
              <th>Generator</th>
              <th>Params</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr key={col._key} style={{ borderBottom: "1px solid #ddd" }}>
                <td>
                  <input
                    value={col.name}
                    onChange={e => updateColumn(i, { name: e.target.value })}
                    style={{ width: 100, borderColor: nameErrors[i] ? "red" : undefined, padding: "4px 6px" }}
                    aria-invalid={!!nameErrors[i]}
                  />
                  {nameErrors[i] && (
                    <div style={{ color: "red", fontSize: 12 }}>{nameErrors[i]}</div>
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    value={col.start ?? ""}
                    onChange={e =>
                      updateColumn(i, {
                        start: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    style={{ width: 60, padding: "4px 6px" }}
                  />
                </td>
                <td>
                  <select
                    value={col.generator}
                    onChange={e => changeGenerator(i, e.target.value)}
                    style={{ padding: "4px 6px" }}
                  >
                    {generatorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ fontSize: 12 }}>
                  {col.generator === "sine" && (
                    <>
                      <label>Min: <input type="number" value={col.min ?? 0} onChange={e => updateColumn(i, { min: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>{" "}
                      <label>Max: <input type="number" value={col.max ?? 1} onChange={e => updateColumn(i, { max: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>{" "}
                      <label>Period: <input type="number" value={col.period ?? 20} min={1} onChange={e => updateColumn(i, { period: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>
                    </>
                  )}
                  {col.generator === "random" && (
                    <>
                      <label>Min: <input type="number" value={col.min ?? 0} onChange={e => updateColumn(i, { min: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>{" "}
                      <label>Max: <input type="number" value={col.max ?? 1} onChange={e => updateColumn(i, { max: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>{" "}
                      <label>Step: <input type="number" value={col.step ?? 1} min={1} onChange={e => updateColumn(i, { step: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>
                    </>
                  )}
                  {col.generator === "increment" && (
                    <>
                      <label>Delta: <input type="number" value={col.delta ?? 1} onChange={e => updateColumn(i, { delta: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>{" "}
                      <label>Step: <input type="number" value={col.step ?? 1} min={1} onChange={e => updateColumn(i, { step: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>
                    </>
                  )}
                  {col.generator === "constant" && (
                    <label>Value: <input type="number" value={col.value ?? 0} onChange={e => updateColumn(i, { value: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>
                  )}
                  {!BUILT_IN_GENERATORS.includes(col.generator) && (
                    <label>Step: <input type="number" value={col.step ?? 1} min={1} onChange={e => updateColumn(i, { step: Number(e.target.value) })} style={{ width: 50, padding: "4px 6px" }} /></label>
                  )}
                </td>
                <td>
                  <button
                    aria-label={`Remove column ${col.name.trim() || i + 1}`}
                    disabled={columns.length <= 1}
                    onClick={() => removeColumn(i)}
                  >
                    –
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addColumn} style={{ marginTop: 8 }}>+ Add column</button>

        <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onResetToDefault}>Reset to default</button>
          <button onClick={onCancel}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
