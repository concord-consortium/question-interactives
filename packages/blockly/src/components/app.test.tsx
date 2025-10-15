import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useAuthoredState, useInitMessage, useInteractiveState
        } from "@concord-consortium/lara-interactive-api";
import { App } from "./app";
import { IInteractiveState, DemoAuthoredState } from "./types";
import { customBlocksAuthoredState } from "./__mocks__/fixtures";

jest.unmock("react-jsonschema-form");

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useInitMessage: jest.fn(),
  useAuthoredState: jest.fn(),
  useInteractiveState: jest.fn(),
  setSupportedFeatures: jest.fn(),
  getFirebaseJwt: jest.fn().mockReturnValue({token: "test"}),
  getClient: jest.fn().mockReturnValue({
    addListener: jest.fn()
  }),
  useAccessibility: jest.fn(() => ({})),
}));

const useInitMessageMock = useInitMessage as jest.Mock;
const useAuthoredStateMock = useAuthoredState as jest.Mock;
const useInteractiveStateMock = useInteractiveState as jest.Mock;

const interactiveState: IInteractiveState = {
  answerType: "interactive_state",
};

describe("Blockly question", () => {
  beforeEach(() => {
    useInitMessageMock.mockClear();
    useAuthoredStateMock.mockClear();
    useInteractiveStateMock.mockClear();
  });

  it("renders in authoring mode", async () => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "authoring",
      DemoAuthoredState
    });
    useAuthoredStateMock.mockReturnValue(DemoAuthoredState);
    useInteractiveStateMock.mockReturnValue(interactiveState);

    const { container } = render(<App />);
    await waitFor(() => {
      expect(container).toBeDefined();
    });
  });

  it("renders custom blocks section in authoring mode", async () => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "authoring",
      DemoAuthoredState
    });
    useAuthoredStateMock.mockReturnValue(customBlocksAuthoredState);
    useInteractiveStateMock.mockReturnValue(interactiveState);

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Custom Blocks")).toBeInTheDocument();
    });
  });
});
