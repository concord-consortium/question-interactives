import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { inject } from "blockly";
import React, { useEffect, useRef, useState } from "react";

import { IAuthoredState, IInteractiveState } from "./types";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { toolbox } = authoredState;
  const [error, setError] = useState<Error | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolbox) {
      setError(new Error("Enter a toolbox configuration to see Blockly."));
      return;
    }

    if (blocklyDivRef.current) {
      try {
        inject(blocklyDivRef.current, {toolbox: JSON.parse(toolbox)});
        setError(null);
      } catch (e) {
        setError(e);
      }
    }
  }, [toolbox]);

  return (
    <div className={css.blockly}>
      {error && <div className={css.error}>Error loading Blockly: {error.message}</div>}
      <div className={css.blocklyDiv} ref={blocklyDivRef}></div>
    </div>
  );
};
