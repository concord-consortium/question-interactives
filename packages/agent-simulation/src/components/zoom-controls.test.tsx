import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ZoomControls } from "./zoom-controls";
import { ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN } from "../constants";

describe("ZoomControls", () => {
  const defaultProps = {
    zoomLevel: ZOOM_DEFAULT,
    onFitAll: jest.fn(),
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all zoom control buttons", () => {
    render(<ZoomControls {...defaultProps} />);

    expect(screen.getByTestId("fit-all-in-view-button")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-in-button")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out-button")).toBeInTheDocument();
  });

  it("calls `onZoomIn` when zoom in button is clicked", () => {
    render(<ZoomControls {...defaultProps} />);

    fireEvent.click(screen.getByTestId("zoom-in-button"));

    expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it("calls `onZoomOut` when zoom out button is clicked", () => {
    render(<ZoomControls {...defaultProps} />);

    fireEvent.click(screen.getByTestId("zoom-out-button"));

    expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it("calls `onFitAll` when fit all button is clicked", () => {
    render(<ZoomControls {...defaultProps} zoomLevel={1.5} />);

    fireEvent.click(screen.getByTestId("fit-all-in-view-button"));

    expect(defaultProps.onFitAll).toHaveBeenCalledTimes(1);
  });

  describe("button states", () => {
    it("disables fit all button when zoom level is 1", () => {
      render(<ZoomControls {...defaultProps} zoomLevel={ZOOM_DEFAULT} />);

      expect(screen.getByTestId("fit-all-in-view-button")).toBeDisabled();
    });

    it("enables fit all button when zoom level is not 1", () => {
      render(<ZoomControls {...defaultProps} zoomLevel={1.5} />);

      expect(screen.getByTestId("fit-all-in-view-button")).not.toBeDisabled();
    });

    it("disables zoom in button when at maximum zoom", () => {
      render(<ZoomControls {...defaultProps} zoomLevel={ZOOM_MAX} />);

      expect(screen.getByTestId("zoom-in-button")).toBeDisabled();
    });

    it("enables zoom in button when below maximum zoom", () => {
      render(<ZoomControls {...defaultProps} zoomLevel={1.5} />);

      expect(screen.getByTestId("zoom-in-button")).not.toBeDisabled();
    });

    it("disables zoom out button when at minimum zoom", () => {
      render(<ZoomControls {...defaultProps} zoomLevel={ZOOM_MIN} />);

      expect(screen.getByTestId("zoom-out-button")).toBeDisabled();
    });

    it("enables zoom out button when above minimum zoom", () => {
      render(<ZoomControls {...defaultProps} zoomLevel={ZOOM_DEFAULT} />);

      expect(screen.getByTestId("zoom-out-button")).not.toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has correct aria labels for all buttons", () => {
      render(<ZoomControls {...defaultProps} />);

      expect(screen.getByLabelText("Fit all in view")).toBeInTheDocument();
      expect(screen.getByLabelText("Zoom in")).toBeInTheDocument();
      expect(screen.getByLabelText("Zoom out")).toBeInTheDocument();
    });

    it("has correct titles for all buttons", () => {
      render(<ZoomControls {...defaultProps} />);

      expect(screen.getByTitle("Fit all in view")).toBeInTheDocument();
      expect(screen.getByTitle("Zoom in")).toBeInTheDocument();
      expect(screen.getByTitle("Zoom out")).toBeInTheDocument();
    });
  });
});