import React from "react";
import { render, cleanup } from "@testing-library/react";

import { IframeRuntime } from "./iframe-runtime";

// iframe-phone tries to talk to a real iframe; stub it so the component mounts cleanly.
jest.mock("iframe-phone", () => ({
  __esModule: true,
  default: {
    ParentEndpoint: jest.fn().mockImplementation(() => ({
      post: jest.fn(),
      addListener: jest.fn(),
      disconnect: jest.fn(),
    })),
  },
}));

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  closeModal: jest.fn(),
  flushStateUpdates: jest.fn(),
  getClient: jest.fn(() => ({ post: jest.fn(), addListener: jest.fn() })),
  log: jest.fn(),
  setOnUnload: jest.fn(),
  showModal: jest.fn(),
}));

const baseProps = {
  interactiveState: null,
  setInteractiveState: jest.fn(),
  accessibility: {} as any,
};

afterEach(cleanup);

describe("IframeRuntime iframe title", () => {
  it("uses the title prop when provided", () => {
    const { container } = render(
      <IframeRuntime {...baseProps} url="https://example.com/image" title="Slide 2: Image" />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("title", "Slide 2: Image");
  });

  it("falls back to the library interactive name when no title prop is given", () => {
    const { container } = render(
      <IframeRuntime {...baseProps} url="https://example.com/image" />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("title", "Image");
  });

  it("falls back to a generic title when the url matches no known interactive", () => {
    const { container } = render(
      <IframeRuntime {...baseProps} url="https://example.com/unknown-thing" />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute("title", "Interactive content");
  });
});
