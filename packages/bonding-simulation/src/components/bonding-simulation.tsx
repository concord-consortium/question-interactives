import * as AV from "@concord-consortium/atomic-agents-vis";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";

import { SIM_SPEED_DEFAULT, ZOOM_ANIMATION_DURATION, ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "../constants";
import { BondingSimulation, SimulationConfig } from "../models/bonding-simulation";
import { IAuthoredState, IInteractiveState } from "./types";
import { ControlPanel } from "./control-panel";
import { Widgets } from "./widgets";
import { ZoomControls } from "./zoom-controls";
import { BondRenderer } from "./bond-renderer";

import css from "./agent-simulation.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> { }

export const BondingSimulationComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {
  const { chamberWidth, chamberHeight, gridStep, initialH, initialO, initialCl, initialCH4, initialTemperature } = authoredState;

  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<BondingSimulation | null>(null);
  const visRef = useRef<AV.VisHandle | null>(null);
  const bondRendererRef = useRef<BondRenderer | null>(null);
  const atomMapRef = useRef(new Map<number, any>());
  const simSpeedRef = useRef(interactiveState?.simSpeed ?? SIM_SPEED_DEFAULT);

  const [paused, setPaused] = useState(true);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [simVersion, setSimVersion] = useState(0);

  const config: SimulationConfig = React.useMemo(() => ({
    width: chamberWidth,
    height: chamberHeight,
    gridStep,
    initialH,
    initialO,
    initialCl,
    initialCH4,
    initialTemperature,
  }), [chamberWidth, chamberHeight, gridStep, initialH, initialO, initialCl, initialCH4, initialTemperature]);

  // One-time setup: create simulation + vis canvas (only on mount or authored config change)
  const setupSimulation = useCallback(() => {
    if (!containerRef.current) return;

    // Cleanup previous
    try { bondRendererRef.current?.destroy(); } catch (_) { /* PixiJS cleanup can throw */ }
    try { visRef.current?.destroy(); } catch (_) { /* PixiJS cleanup can throw */ }
    try { simRef.current?.destroy(); } catch (_) { /* PixiJS cleanup can throw */ }

    // Remove any leftover canvas elements from previous vis
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const bondingSim = new BondingSimulation(config);
    simRef.current = bondingSim;

    // afterTick: run chemistry engine + render bonds
    const afterTick = () => {
      bondingSim.tick();
      const atomMap = atomMapRef.current;
      atomMap.clear();
      for (const a of bondingSim.atoms) {
        if (a.id != null) atomMap.set(a.id, a);
      }
      bondRendererRef.current?.render(bondingSim.chemistryEngine.bonds, atomMap);
    };

    // Visualize
    visRef.current = AV.vis(bondingSim.sim, {
      speed: simSpeedRef.current,
      target: containerRef.current,
      preserveDrawingBuffer: true,
      afterTick,
    });

    // White background + bond renderer
    const app = visRef.current?.app;
    if (app) {
      app.renderer.backgroundColor = 0xFFFFFF;
      bondRendererRef.current = new BondRenderer(app, AV.PIXI);
    }

    bondingSim.sim.pause(true);
    setPaused(true);
    setSimVersion(v => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamberWidth, chamberHeight, gridStep, initialH, initialO, initialCl, initialCH4, initialTemperature]);

  useEffect(() => {
    setupSimulation();
    return () => {
      try { bondRendererRef.current?.destroy(); } catch (_) { /* ignore */ }
      try { visRef.current?.destroy(); } catch (_) { /* ignore */ }
      try { simRef.current?.destroy(); } catch (_) { /* ignore */ }
    };
  }, [setupSimulation]);

  const handlePlayPause = useCallback(() => {
    if (!simRef.current) return;
    simRef.current.sim.pause(!paused);
    setPaused(!paused);
  }, [paused]);

  // Set Atoms: rebuild simulation with current slider values (preserves globals)
  const handleSetAtoms = useCallback(() => {
    const oldGlobals = simRef.current?.globals;
    if (!containerRef.current) return;

    // Cleanup previous canvas
    try { bondRendererRef.current?.destroy(); } catch (_) { /* ignore */ }
    try { visRef.current?.destroy(); } catch (_) { /* ignore */ }
    try { simRef.current?.destroy(); } catch (_) { /* ignore */ }
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Create new simulation, copying slider values from old globals
    const bondingSim = new BondingSimulation(config);
    if (oldGlobals) {
      for (const key of ["numH", "numO", "numCl", "numCH4", "temperature"]) {
        const val = oldGlobals.get(key);
        if (val != null) bondingSim.globals.set(key, val);
      }
    }
    // Reinitialize atoms with the transferred globals
    bondingSim.reset();
    simRef.current = bondingSim;

    const afterTick = () => {
      bondingSim.tick();
      const atomMap = atomMapRef.current;
      atomMap.clear();
      for (const a of bondingSim.atoms) {
        if (a.id != null) atomMap.set(a.id, a);
      }
      bondRendererRef.current?.render(bondingSim.chemistryEngine.bonds, atomMap);
    };

    visRef.current = AV.vis(bondingSim.sim, {
      speed: simSpeedRef.current,
      target: containerRef.current,
      preserveDrawingBuffer: true,
      afterTick,
    });

    const app = visRef.current?.app;
    if (app) {
      app.renderer.backgroundColor = 0xFFFFFF;
      bondRendererRef.current = new BondRenderer(app, AV.PIXI);
    }

    bondingSim.sim.pause(true);
    setPaused(true);
    setSimVersion(v => v + 1);
  }, [config]);

  // Reset: return to authored defaults
  const handleReset = useCallback(() => {
    setupSimulation();
  }, [setupSimulation]);

  const handleSpeedChange = useCallback((speed: number) => {
    simSpeedRef.current = speed;
    visRef.current?.setSimSpeed?.(speed);
    setInteractiveState?.((prev: IInteractiveState) => ({
      ...prev,
      version: 1 as const,
      answerType: "interactive_state" as const,
      simSpeed: speed,
    }));
  }, [setInteractiveState]);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  }, []);

  const zoomStyle: React.CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: "top left",
    transition: `transform ${ZOOM_ANIMATION_DURATION}ms ease`,
  };

  return (
    <div className={css.agentSimulation}>
      <div className={css.simulationArea}>
        <div className={css.canvasContainer}>
          <div
            ref={containerRef}
            className={css.simulationCanvas}
            style={{
              width: chamberWidth,
              height: chamberHeight,
              ...zoomStyle,
            }}
          />
          <ZoomControls
            zoomLevel={zoom}
            onFitAll={() => setZoom(ZOOM_DEFAULT)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </div>
        <ControlPanel
          paused={paused}
          onPlayPause={handlePlayPause}
          onSetAtoms={handleSetAtoms}
          onReset={handleReset}
          simSpeed={simSpeedRef.current}
          onSpeedChange={handleSpeedChange}
        />
      </div>
      <div className={css.widgetsArea}>
        {simRef.current && simVersion > 0 && (
          <Widgets
            widgets={simRef.current.widgets}
            globals={simRef.current.globals}
          />
        )}
      </div>
    </div>
  );
};
