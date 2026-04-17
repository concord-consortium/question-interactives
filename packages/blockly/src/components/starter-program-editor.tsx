import { Events, inject, serialization } from "blockly";
import React, { useEffect, useMemo, useRef } from "react";

import "../blocks/block-registration";
import { registerCustomBlocks } from "../blocks/block-factory";
import { saveEvents } from "../utils/block-utils";
import { buildValidTypeSet, pruneStarterState } from "../utils/starter-utils";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { ICustomBlock, INITIAL_SEED_BLOCKS, SEED_BLOCK_TYPES } from "./types";

import css from "./starter-program-editor.scss";

interface IProps {
  customBlocks: ICustomBlock[];
  starterBlocklyState: string;
  toolbox: string;
  onChange: (value: string) => void;
}

export const StarterProgramEditor: React.FC<IProps> = ({ customBlocks, starterBlocklyState, toolbox, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hold onChange in a ref so its identity (which RJSF is not guaranteed to keep stable across
  // renders) does not force the injection effect to tear down and rebuild the workspace.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const effectiveStarter = useMemo(() => {
    if (!starterBlocklyState) return "";
    try {
      const valid = buildValidTypeSet(customBlocks);
      return pruneStarterState(starterBlocklyState, valid);
    } catch {
      console.warn("Failed to parse or prune starterBlocklyState, falling back to empty state");
      return "";
    }
  }, [starterBlocklyState, customBlocks]);

  // Persist pruned value back to form state when pruning removes stale block references.
  useEffect(() => {
    if (effectiveStarter && effectiveStarter !== starterBlocklyState) {
      onChangeRef.current(effectiveStarter);
    }
  }, [effectiveStarter, starterBlocklyState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !toolbox) return;
    container.innerHTML = "";

    registerCustomBlocks(customBlocks, false);
    const enhancedToolbox = injectCustomBlocksIntoToolbox(toolbox, customBlocks);

    let workspace: ReturnType<typeof inject>;
    try {
      const parsedToolbox = JSON.parse(enhancedToolbox);
      workspace = inject(container, {
        readOnly: false, toolbox: parsedToolbox, trashcan: true
      });

      if (effectiveStarter) {
        try {
          serialization.workspaces.load(JSON.parse(effectiveStarter), workspace);
        } catch {
          INITIAL_SEED_BLOCKS.forEach(b => serialization.blocks.append(b, workspace));
        }
      } else {
        INITIAL_SEED_BLOCKS.forEach(b => serialization.blocks.append(b, workspace));
      }
      workspace.render();

      workspace.getTopBlocks(false).forEach(b => {
        if ((SEED_BLOCK_TYPES as readonly string[]).includes(b.type)) b.setDeletable(false);
      });
    } catch (e) {
      console.warn("Starter program editor: toolbox or starter state could not be loaded. Check that toolbox JSON is valid.", e);
      return;
    }

    // Match runtime behavior: orphaned blocks should render disabled.
    workspace.addChangeListener(Events.disableOrphans);

    // Suppress saves while a block is being dragged. The RJSF re-render
    // triggered by onChange interrupts Blockly's drag tracking, so we defer
    // the save until the drag completes.
    let needsSave = false;
    const performSave = () => {
      const json = JSON.stringify(serialization.workspaces.save(workspace));
      onChangeRef.current(json);
    };
    const listener = (event: Events.Abstract) => {
      if (event.type === Events.BLOCK_DRAG) {
        if (!(event as any).isStart && needsSave) {
          needsSave = false;
          performSave();
        }
        return;
      }
      if (!saveEvents.includes(event.type)) return;
      if (workspace.isDragging()) {
        needsSave = true;
        return;
      }
      performSave();
    };
    workspace.addChangeListener(listener);

    return () => {
      workspace.removeChangeListener(listener);
      workspace.dispose();
      container.innerHTML = "";
    };
  }, [toolbox, customBlocks, effectiveStarter]);

  return (
    <div className={css.starterEditor} data-testid="starter-program-editor">
      <h4>Starter Program</h4>
      <div className={css.starterEditor_container} ref={containerRef} />
    </div>
  );
};
