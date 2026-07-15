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

describe("Carousel Runtime Prev/Next availability", () => {
  it("disables Prev on the first slide and enables Next", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    expect(getByRole("button", { name: "Previous slide" })).toBeDisabled();
    expect(getByRole("button", { name: "Next slide" })).toBeEnabled();
  });

  it("disables Next on the last slide and enables Prev", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    fireEvent.click(getByRole("button", { name: "Go to slide 2" }));
    expect(getByRole("button", { name: "Next slide" })).toBeDisabled();
    expect(getByRole("button", { name: "Previous slide" })).toBeEnabled();
  });

  it("does not advance past the first slide when disabled Prev is clicked", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    fireEvent.click(getByRole("button", { name: "Previous slide" }));
    // aria-current must stay on slide 1 — currentSlide never goes negative
    expect(getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("aria-current", "true");
  });

  it("gives all nav buttons type=button so they never submit a surrounding form", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    expect(getByRole("button", { name: "Previous slide" })).toHaveAttribute("type", "button");
    expect(getByRole("button", { name: "Next slide" })).toHaveAttribute("type", "button");
    expect(getByRole("button", { name: "Go to slide 1" })).toHaveAttribute("type", "button");
  });
});

describe("Carousel Runtime slide-change announcements", () => {
  beforeEach(() => {
    // Resolve the child interactive type names so the announcement includes them.
    window.history.replaceState(null, "", "/version/0.5.0/carousel");
  });

  it("exposes a polite status region naming the current slide and total", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    const status = getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Slide 1 of 2: Open response");
  });

  it("updates the status region when the slide changes", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    fireEvent.click(getByRole("button", { name: "Go to slide 2" }));
    expect(getByRole("status")).toHaveTextContent("Slide 2 of 2: Image");
  });
});

describe("Carousel Runtime carousel structure", () => {
  it("exposes the carousel as a labeled region", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    const region = getByRole("region", { name: "Carousel" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("labels each slide as a group with its position", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    const slide1 = getByRole("group", { name: "Slide 1 of 2" });
    expect(slide1).toHaveAttribute("aria-roledescription", "slide");
    expect(getByRole("group", { name: "Slide 2 of 2" })).toHaveAttribute("aria-roledescription", "slide");
  });

  it("labels the nav landmark", () => {
    const { getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    expect(getByRole("navigation", { name: "Carousel navigation" })).toBeInTheDocument();
  });

  it("keeps only the current slide reachable, marking off-screen slides inert", () => {
    const { getByLabelText } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    expect(getByLabelText("Slide 1 of 2")).not.toHaveAttribute("inert");
    expect(getByLabelText("Slide 2 of 2")).toHaveAttribute("inert");
  });

  it("moves inert to the previously-current slide when the slide changes", () => {
    const { getByLabelText, getByRole } = render(
      <Runtime authoredState={authoredState} interactiveState={null} setInteractiveState={jest.fn()} />
    );
    fireEvent.click(getByRole("button", { name: "Go to slide 2" }));
    expect(getByLabelText("Slide 1 of 2")).toHaveAttribute("inert");
    expect(getByLabelText("Slide 2 of 2")).not.toHaveAttribute("inert");
  });
});
