import React from "react";

import css from "./demo-authoring.scss";

interface IProps<IAuthoredState> {
  url: string;
  authoredState: IAuthoredState;
  setAuthoredState: React.Dispatch<React.SetStateAction<IAuthoredState>>
}

export function DemoAuthoringComponent<IAuthoredState>(props: IProps<IAuthoredState>) {
  const {authoredState} = props;

  return (
    <div className={css.demoAuthoring}>
      <h2>Authored State</h2>

      <p>
        (to be replaced in the future with real authoring component)
      </p>

      <pre>
        {JSON.stringify(authoredState, null, 2)}
      </pre>
    </div>
  );
}
