import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ControlPanel } from "./control-panel";

describe("ControlPanel", () => {
  const defaultProps = {
    codeUpdateAvailable: false,
    hasBeenStarted: false,
    hasCodeSource: true,
    paused: true,
    currentRecording: undefined,
    onPlayPause: jest.fn(),
    onReset: jest.fn(),
    onUpdateCode: jest.fn(),
    onDeleteRecording: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders play and reset buttons", () => {
      render(<ControlPanel {...defaultProps} />);

      expect(screen.getByTestId("play-pause-button")).toBeInTheDocument();
      expect(screen.getByTestId("reset-button")).toBeInTheDocument();
    });

    it("renders update code button when `hasCodeSource` is true", () => {
      render(<ControlPanel {...defaultProps} codeUpdateAvailable={true} />);

      expect(screen.getByTestId("update-code-button")).toBeInTheDocument();
    });

    it("does not render update code button when `hasCodeSource` is false", () => {
      render(<ControlPanel {...defaultProps} hasCodeSource={false} />);

      expect(screen.queryByTestId("update-code-button")).not.toBeInTheDocument();
    });
  });

  describe("play/pause button", () => {
    it("shows play icon and has 'Play' label when paused", () => {
      render(<ControlPanel {...defaultProps} paused={true} />);

      const button = screen.getByTestId("play-pause-button");
      expect(button).toHaveAttribute("aria-label", "Play");
      expect(button).toHaveAttribute("title", "Play");
    });

    it("shows pause icon and has 'Pause' label when playing", () => {
      render(<ControlPanel {...defaultProps} paused={false} />);

      const button = screen.getByTestId("play-pause-button");
      expect(button).toHaveAttribute("aria-label", "Pause");
      expect(button).toHaveAttribute("title", "Pause");
    });

    it("calls `onPlayPause` when clicked", () => {
      render(<ControlPanel {...defaultProps} />);

      fireEvent.click(screen.getByTestId("play-pause-button"));

      expect(defaultProps.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it("applies correct CSS classes based on paused state", () => {
      const { rerender } = render(<ControlPanel {...defaultProps} paused={true} />);

      let button = screen.getByTestId("play-pause-button");
      expect(button).toHaveClass("paused");
      expect(button).not.toHaveClass("playing");

      rerender(<ControlPanel {...defaultProps} paused={false} />);

      button = screen.getByTestId("play-pause-button");
      expect(button).toHaveClass("playing");
      expect(button).not.toHaveClass("paused");
    });
  });

  describe("reset button", () => {
    it("is enabled when simulation has been started", () => {
      render(<ControlPanel {...defaultProps} hasBeenStarted={true} />);

      expect(screen.getByTestId("reset-button")).not.toBeDisabled();
    });

    it("is disabled when simulation has not been started", () => {
      render(<ControlPanel {...defaultProps} hasBeenStarted={false} />);

      expect(screen.getByTestId("reset-button")).toBeDisabled();
    });

    it("calls `onReset` when clicked", () => {
      render(<ControlPanel {...defaultProps} hasBeenStarted={true} />);

      fireEvent.click(screen.getByTestId("reset-button"));

      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });

    it("has correct accessibility attributes", () => {
      render(<ControlPanel {...defaultProps} />);

      const button = screen.getByTestId("reset-button");
      expect(button).toHaveAttribute("aria-label", "Reset");
      expect(button).toHaveAttribute("title", "Reset");
    });
  });

  describe("update code button", () => {
    describe("when `hasCodeSource` is true", () => {
      it("is enabled when code update is available", () => {
        render(<ControlPanel {...defaultProps} hasCodeSource={true} codeUpdateAvailable={true} />);

        expect(screen.getByTestId("update-code-button")).not.toBeDisabled();
      });

      it("is disabled when code update is not available", () => {
        render(<ControlPanel {...defaultProps} hasCodeSource={true} codeUpdateAvailable={false} />);

        expect(screen.getByTestId("update-code-button")).toBeDisabled();
      });

      it("calls `onUpdateCode` when clicked", () => {
        render(<ControlPanel {...defaultProps} hasCodeSource={true} codeUpdateAvailable={true} />);

        fireEvent.click(screen.getByTestId("update-code-button"));

        expect(defaultProps.onUpdateCode).toHaveBeenCalledTimes(1);
      });

      it("has correct accessibility attributes", () => {
        render(<ControlPanel {...defaultProps} hasCodeSource={true} />);

        const button = screen.getByTestId("update-code-button");
        expect(button).toHaveAttribute("aria-label", "Update Code");
        expect(button).toHaveAttribute("title", "Update Code");
      });
    });

    describe("when `hasCodeSource` is false", () => {
      it("does not render the button", () => {
        render(<ControlPanel {...defaultProps} hasCodeSource={false} />);

        expect(screen.queryByTestId("update-code-button")).not.toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA labels for all buttons", () => {
      render(<ControlPanel {...defaultProps} hasCodeSource={true} paused={true} />);

      expect(screen.getByLabelText("Play")).toBeInTheDocument();
      expect(screen.getByLabelText("Reset")).toBeInTheDocument();
      expect(screen.getByLabelText("Update Code")).toBeInTheDocument();
    });

    it("has proper titles for all buttons", () => {
      render(<ControlPanel {...defaultProps} hasCodeSource={true} paused={true} />);

      expect(screen.getByTitle("Play")).toBeInTheDocument();
      expect(screen.getByTitle("Reset")).toBeInTheDocument();
      expect(screen.getByTitle("Update Code")).toBeInTheDocument();
    });
  });

  describe("interaction scenarios", () => {
    it("handles multiple button clicks correctly", () => {
      render(<ControlPanel {...defaultProps} hasCodeSource={true} codeUpdateAvailable={true} hasBeenStarted={true} />);

      fireEvent.click(screen.getByTestId("play-pause-button"));
      fireEvent.click(screen.getByTestId("reset-button"));
      fireEvent.click(screen.getByTestId("update-code-button"));

      expect(defaultProps.onPlayPause).toHaveBeenCalledTimes(1);
      expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
      expect(defaultProps.onUpdateCode).toHaveBeenCalledTimes(1);
    });

    it("does not call handlers for disabled buttons", () => {
      render(<ControlPanel {...defaultProps} hasCodeSource={true} codeUpdateAvailable={false} hasBeenStarted={false} />);

      fireEvent.click(screen.getByTestId("reset-button"));
      fireEvent.click(screen.getByTestId("update-code-button"));

      expect(defaultProps.onReset).not.toHaveBeenCalled();
      expect(defaultProps.onUpdateCode).not.toHaveBeenCalled();
    });
  });
});
