import React from "react";
import queryString from "query-string";
import { BaseQuestionApp } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoringComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { Runtime } from "./runtime";
import { Authoring } from "./authoring";
import { IAuthoredState, IInteractiveState } from "./types";
import { detectInteractiveType } from "../utils/detect-interactive-type";
import { getAuthoringConfig } from "../authoring-configs";
import { parsePrefixedParams } from "../utils/url-prefix-params";

// Wrapper component that provides additional props to Authoring
const AuthoringWrapper: React.FC<IAuthoringComponentProps<IAuthoredState>> = ({
  authoredState,
  setAuthoredState
}) => {
  const params = queryString.parse(location.search);
  const wrappedInteractive = Array.isArray(params.wrappedInteractive)
    ? params.wrappedInteractive[0]
    : params.wrappedInteractive;

  // Get authoring param (used to select which config)
  const authoringParam = Array.isArray(params.authoring)
    ? params.authoring[0]
    : params.authoring;

  // Determine which authoring config to use:
  // 1. authoring=<type> → use specified config (explicit override)
  // 2. Wrapped URL detected as known type → use detected config (auto-detect)
  // 3. Everything else → use generic config (fallback)
  const detectedType = wrappedInteractive ? detectInteractiveType(wrappedInteractive) : null;
  const normalizedAuthoringParam = typeof authoringParam === "string"
    ? authoringParam.trim().toLowerCase()
    : "";

  let authoringType = normalizedAuthoringParam
    ? normalizedAuthoringParam
    : detectedType ?? "generic";

  // Fall back to generic if explicit authoring param doesn't match a known config
  if (normalizedAuthoringParam && !getAuthoringConfig(authoringType)) {
    console.warn(
      `Unknown authoring type "${authoringParam}" - falling back to generic config. ` +
      `Known types: codap, generic`
    );
    authoringType = "generic";
  }

  // Parse default: and custom: prefixed parameters from the URL
  const { defaults: urlDefaults, customs: urlCustoms } = parsePrefixedParams(location.search);

  // Initialize authored state, using URL param as fallback for wrappedInteractiveUrl.
  // This handles cases where:
  // 1. authoredState is null/undefined (new interactive)
  // 2. authoredState exists but is empty (e.g., {} from LARA/AP)
  // 3. authoredState exists but wrappedInteractiveUrl is not set
  const currentAuthoredState: IAuthoredState = {
    version: 1,
    questionType: "iframe_interactive",
    ...(authoredState || {}),
    // Use URL param as fallback only if wrappedInteractiveUrl is not already set
    wrappedInteractiveUrl: authoredState?.wrappedInteractiveUrl || wrappedInteractive || undefined
  };

  // Adapter: setAuthoredState expects an update function, but Authoring
  // passes the new state directly. Wrap it to match the expected signature.
  const handleAuthoredStateChange = (newState: IAuthoredState) => {
    if (setAuthoredState) {
      setAuthoredState(() => newState);
    }
  };

  return (
    <Authoring
      authoredState={currentAuthoredState}
      onAuthoredStateChange={handleAuthoredStateChange}
      authoringType={authoringType}
      urlDefaults={urlDefaults}
      urlCustoms={urlCustoms}
    />
  );
};

export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Authoring={AuthoringWrapper}
    Runtime={Runtime}
    disableAutoHeight={true}
    disableSubmitBtnRendering={true}
    allowEmptyAuthoredStateAtRuntime={true}
  />
);
