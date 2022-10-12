import React from "react";

import { IframeRuntime } from "../../shared/components/iframe-runtime";
import { DemoAuthoringComponent } from "./demo-authoring";

import css from "./demo.scss";

interface IProps<IAuthoredState, IInteractiveState> {
  title: string;
  App: JSX.Element;
  authoredState: IAuthoredState;
  interactiveState: IInteractiveState;
}

const iframe = new URLSearchParams(window.location.search).get("iframe");

export const DemoComponent = <IAuthoredState, IInteractiveState>(props: IProps<IAuthoredState, IInteractiveState>) => {
  const {App, authoredState, interactiveState, title} = props;

  // this is just dropped on the floor as we don't need to save in the demo
  const setInteractiveState = () => undefined;

  // TODO: in future once bar graph authoring is done setup a iframe proxy
  // to send the new authored state to the root demo and have it re-render
  const setAuthoredState = () => undefined;

  switch (iframe) {
    case "authoring-container":
      return (
        <DemoAuthoringComponent
          url="demo.html?iframe=authoring"
          authoredState={authoredState}
          setAuthoredState={setAuthoredState}
        />
      );

    case "runtime-container":
      return (
        <IframeRuntime
          url="demo.html?iframe=runtime"
          authoredState={authoredState}
          interactiveState={interactiveState}
          setInteractiveState={setInteractiveState}
        />
      );

    case "authoring":
      return App;

    case "runtime":
      return App;

    default:
      return (
        <div className={css.demo}>
          <div className={css.header}><h1>{title}</h1></div>
          <div className={css.split}>
            <div className={css.authoring}><iframe src="demo.html?iframe=authoring-container" /></div>
            <div className={css.runtime}><iframe src="demo.html?iframe=runtime-container" /></div>
          </div>
        </div>
      );
  }
};
