import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TakeSnapshot } from "./take-snapshot";
import { IAuthoredState, IInteractiveState } from "./types";
import { getInteractiveSnapshot, useInitMessage } from "@concord-consortium/lara-interactive-api";
import { InitMessageContext } from "@concord-consortium/question-interactives-helpers/src/hooks/use-context-init-message";
import { act } from "react-dom/test-utils";

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getInteractiveSnapshot: jest.fn(() => new Promise(resolve => resolve({success: true, snapshotUrl: "http://snapshot/123" }))),
  useInitMessage: jest.fn()
}));
const getInteractiveSnapshotMock = getInteractiveSnapshot as jest.Mock;
const useInitMessageMock = useInitMessage as jest.Mock;

const authoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  prompt: "Test prompt",
  hint: "hint",
  required: false,
  imageFit: "center",
  imagePosition: "center",
  stampCollections: []
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state" as const,
};
const baseInitMessage = {
  authInfo: {
    provider: "",
    loggedIn: true,
    email: "fake@concord.org"
  },
  authoredState: authoredState,
  classInfoUrl: "",
  collaboratorUrls: [],
  error: null,
  globalInteractiveState: null,
  hostFeatures: {},
  interactive: {
    id: "456",
    name: "snapshot"
  },
  interactiveItemId: "456-MwInteractive",
  interactiveState: null,
  interactiveStateUrl: "",
  mode: "runtime" as const,
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "snapshotTarget"
    }
  ],
  themeInfo: {
    colors: {
      colorA: "orange",
      colorB: "blue"
    }
  },
  version: 1 as const
};

const initMessageWithSnapshotTarget = {
  ...baseInitMessage,
  linkedInteractives: [
    {
      id: "123-MwInteractive",
      label: "snapshotTarget"
    }
  ]
};

const initMessageWithoutSnapshotTarget = {
  ...baseInitMessage,
  linkedInteractives: []
};

describe("TakeSnapshot", () => {
  beforeEach(() => {
    getInteractiveSnapshotMock.mockClear();
    useInitMessageMock.mockClear();
  });

  it("renders snapshot button when snapshotTarget is set", () => {
    useInitMessageMock.mockReturnValue(initMessageWithSnapshotTarget);
    render(
      <InitMessageContext.Provider value={initMessageWithSnapshotTarget}>
        <TakeSnapshot authoredState={authoredState} interactiveState={interactiveState} />
      </InitMessageContext.Provider>
    );

    fireEvent.click(screen.getByTestId("snapshot-btn"));
    expect(getInteractiveSnapshotMock).toHaveBeenCalledWith({ interactiveItemId: "123-MwInteractive" });
  });

  it("renders warning snapshotTarget is not set", () => {
    useInitMessageMock.mockReturnValue(initMessageWithoutSnapshotTarget);
    render(
      <InitMessageContext.Provider value={initMessageWithoutSnapshotTarget}>
        <TakeSnapshot authoredState={authoredState} interactiveState={interactiveState} />
      </InitMessageContext.Provider>
    );

    expect(screen.queryByTestId("snapshot-btn")).toBeNull();
    expect(screen.getByText("Snapshot won't work, as no target interactive is selected")).toBeInTheDocument();
  });
});
