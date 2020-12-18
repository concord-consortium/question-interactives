import React from "react";
import { FieldProps } from "react-jsonschema-form";
import css from "./initial-state-field.scss";
import { IFormContext } from "../../shared/components/base-authoring";
import { IAuthoredState, IInitialState } from "./types";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";

//Custom react-jsonschema-form field.
export const InitialStateField: React.FC<FieldProps<IInitialState>> = props => {
  const { onChange, formData } = props;
  const formContext: IFormContext<IAuthoredState> = props.formContext || {};
  // This merge is theoretically not necessary. After initial state is updated using `onChange`, it'll eventually
  // get merged with the authored state. However, it seems it happens with a little delay and can be sometimes visible
  // in authoring (draggable items will jump a bit). So, simply overwrite initialState with the most recent value
  // available here (and probably managed in a parent component).
  const authoredState = {...formContext.authoredState, initialState: formData };

  const setInitialState = (initialState: IInitialState) => {
    onChange(initialState);
  };

  return (
    <div className={css.authoringPreview}>
      {/* label.control-label will be automatically styled by react-jsonschema-form */}
      <label className="control-label">Initial positions of draggable items</label>
      <ContainerWithDndProvider authoredState={authoredState} setInitialState={setInitialState} />
    </div>
  );
};
