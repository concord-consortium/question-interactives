import React from "react";
import { render, screen } from "@testing-library/react";
import { IThumbnailProps } from "./thumbnail";
import { IThumbnailWrapperProps, ThumbnailWrapper } from "./thumbnail-wrapper";

const thumb:IThumbnailProps = {
  id: "one",
  data: {},
  label: "one",
  empty: false,
  thumbContent: "Thumbnail"
};

const emptyThumb:IThumbnailProps = {
  id: "one",
  data: {},
  label: "one",
  empty: true,
  thumbContent: null
};

describe("ThumbnailWrapper component", () => {
  it("renders wrapper with saved title icon", () => {

    const thumbnailWrapperProps: IThumbnailWrapperProps = {
      selected: true,
      setSelectedContainerId: (id: string) => undefined,
      clearContainer: (id: string) => undefined,
      content: thumb,
      readOnly: false
    };

    render(<ThumbnailWrapper {...thumbnailWrapperProps} />);
    expect(screen.getAllByTestId("thumbnail-wrapper")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-button")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-title")).toHaveLength(1);
    expect(screen.queryAllByTestId("thumbnail-plus-button")).toHaveLength(0);
    expect(screen.getAllByTestId("thumbnail-close-button")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
  });

  it("renders wrapper without saved title icon", () => {
    const thumbnailWrapperProps: IThumbnailWrapperProps= {
      selected: true,
      setSelectedContainerId: (containerId: string) => undefined,
      clearContainer: (containerId: string) => undefined,
      content: thumb,
      readOnly: false
    };

    render(<ThumbnailWrapper { ...thumbnailWrapperProps } />);
    expect(screen.getAllByTestId("thumbnail-wrapper")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-button")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-title")).toHaveLength(1);
    expect(screen.queryAllByTestId("thumbnail-plus-button")).toHaveLength(0);
    expect(screen.getAllByTestId("thumbnail-close-button")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
  });

  it("renders wrapper with plus button with empty content", () => {
    const thumbnailWrapperProps: IThumbnailWrapperProps= {
      selected: true,
      setSelectedContainerId: (containerId: string) => undefined,
      clearContainer: (containerId: string) => undefined,
      content: emptyThumb,
      readOnly: false
    };

    render(<ThumbnailWrapper { ...thumbnailWrapperProps } />);
    expect(screen.getAllByTestId("thumbnail-plus-button")).toHaveLength(1);
    expect(screen.queryAllByTestId("thumbnail-close-button")).toHaveLength(0);
  });

  it("renders a readonly view", () => {
    const thumbnailWrapperProps: IThumbnailWrapperProps= {
      selected: true,
      setSelectedContainerId: (containerId: string) => undefined,
      clearContainer: (containerId: string) => undefined,
      content: emptyThumb,
      readOnly: true
    };

    render(<ThumbnailWrapper { ...thumbnailWrapperProps } />);
    expect(screen.queryAllByTestId("thumbnail-plus-button")).toHaveLength(0);
    expect(screen.queryAllByTestId("thumbnail-close-button")).toHaveLength(0);
  });
});
