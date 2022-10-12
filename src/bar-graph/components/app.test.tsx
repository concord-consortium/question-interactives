import React from "react";
import { render } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState
        } from "@concord-consortium/lara-interactive-api";
import { App } from "./app";
import { IInteractiveState } from "./types";
import { DemoAuthoredState } from "../demo-authored-state";

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

const interactiveState: IInteractiveState = {
  answerType: "interactive_state",
};

describe("Bar graph question", () => {
  useInitMessageMock.mockReturnValue({
    version: 1,
    mode: "authoring",
    DemoAuthoredState
  });
  useAuthoredStateMock.mockReturnValue(DemoAuthoredState);
  useInteractiveStateMock.mockReturnValue(interactiveState);

  it("renders in authoring mode", async () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
