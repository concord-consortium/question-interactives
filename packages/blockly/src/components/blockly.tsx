import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { inject } from "blockly";
import React, { useEffect, useRef } from "react";

import { IAuthoredState, IInteractiveState } from "./types";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { config } = authoredState;
  const errorRef = useRef<Error | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config) {
      errorRef.current = new Error("Enter a toolbox configuration to see Blockly.");
      return;
    }

    if (blocklyDivRef.current) {
      try {
        inject(blocklyDivRef.current, {toolbox: JSON.parse(config)});
        errorRef.current = null;
      } catch (e) {
        errorRef.current = e;
      }
    }
  }, [config]);

  return (
    <div className={css.blockly}>
      {errorRef.current && <div className={css.error}>Error loading Blockly: {errorRef.current.message}</div>}
      <div className={css.blocklyDiv} ref={blocklyDivRef}></div>
    </div>
  );
};
