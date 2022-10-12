import React from "react";
import { render } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState
        } from "@concord-consortium/lara-interactive-api";
import { App } from "./app";
import { IAuthoredState, IInteractiveState } from "./types";

jest.unmock("react-jsonschema-form");

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAuthoredState: jest.fn(),
  useInteractiveState: jest.fn(),
  setSupportedFeatures: jest.fn(),
  getFirebaseJwt: jest.fn().mockReturnValue({token: "test"}),
}));

const useInitMessageMock = useInitMessage as jest.Mock;
const useAuthoredStateMock = useAuthoredState as jest.Mock;
const useInteractiveStateMock = useInteractiveState as jest.Mock;

const authoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive"
};

const interactiveState: IInteractiveState = {
  answerType: "interactive_state",
};

describe("Bar graph question", () => {
  useInitMessageMock.mockReturnValue({
    version: 1,
    mode: "authoring",
    authoredState
  });
  useAuthoredStateMock.mockReturnValue(authoredState);
  useInteractiveStateMock.mockReturnValue(interactiveState);

  it("renders in authoring mode", async () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
