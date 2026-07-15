import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";

import { Runtime } from "./runtime";
import { IAuthoredState } from "./types";

// Capture the props each child IframeRuntime is rendered with, so we can assert the title
// the carousel derives for each slide.
jest.mock("@concord-consortium/question-interactives-helpers/src/components/iframe-runtime", () => ({
  IframeRuntime: (props: any) => <div data-testid="iframe-runtime" data-title={props.title} />,
}));

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  useAccessibility: jest.fn(() => ({})),
  getClient: jest.fn(() => ({ post: jest.fn(), addListener: jest.fn() })),
}));

const authoredState: IAuthoredState = {
  version: 2,
  questionType: "iframe_interactive",
  subinteractives: [
    { id: "1", libraryInteractiveId: "open-response", authoredState: {} },
    { id: "2", libraryInteractiveId: "image", authoredState: {} },
  ],
};

afterEach(cleanup);

describe("Carousel Runtime child iframe titles", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    // The title's type name ("Open response", "Image") is resolved from the child's URL, which
    // libraryInteractiveIdToUrl builds by swapping the trailing "carousel" segment of the current
    // location for the child's id. The default jest testURL has no "carousel" segment, so without
    // this the swap is a no-op, no type name resolves, and titles come out as just "Slide N".
    window.history.replaceState(null, "", "/version/0.5.0/carousel");
  });

  afterEach(() => {
    window.history.replaceState(null, "", originalHref);
  });

  it("gives each child iframe a 'Slide N: <interactive type>' title", () => {
    const { getAllByTestId } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    const titles = getAllByTestId("iframe-runtime").map(el => el.getAttribute("data-title"));
    expect(titles).toEqual(["Slide 1: Open response", "Slide 2: Image"]);
  });

  it("falls back to a generic type name when the interactive type can't be resolved", () => {
    const unknownState: IAuthoredState = {
      version: 2,
      questionType: "iframe_interactive",
      subinteractives: [
        { id: "1", libraryInteractiveId: "not-a-real-interactive", authoredState: {} },
      ],
    };
    const { getByTestId } = render(
      <Runtime authoredState={unknownState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    expect(getByTestId("iframe-runtime")).toHaveAttribute("data-title", "Slide 1: Interactive content");
  });
});

describe("Carousel Runtime active slide indication", () => {
  it("marks only the active slide's nav button with aria-current=true", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    expect(getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");
    expect(getByRole("button", { name: "Go to slide 2" })).not.toHaveAttribute("aria-current");
  });

  it("moves aria-current to the newly selected slide when a nav button is clicked", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    fireEvent.click(getByRole("button", { name: "Go to slide 2" }));
    expect(getByRole("button", { name: "Go to slide 1" })).not.toHaveAttribute("aria-current");
    expect(getByRole("button", { name: "Go to slide 2" })).toHaveAttribute("aria-current", "true");
  });
});
