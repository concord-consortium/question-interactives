import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { IThumbnailProps } from "./thumbnail";
import { IThumbnailWrapperProps, ThumbnailWrapper } from "./thumbnail-wrapper";

const content: React.FC<IThumbnailProps> = () => <div data-testid="thumbnail">Thumbnail</div>;

const thumb:IThumbnailProps = {
  id: "one",
  data: {},
  label: "one",
  empty: false,
  thumbContent: content
};


describe("ThumbnailWrapper component", () => {
  it("renders wrapper with saved title icon", () => {

    const thumbnailWrapperProps: IThumbnailWrapperProps = {
      selected: true,
      setSelectedContainerId: (id: string) => undefined,
      clearContainer: (id: string) => undefined,
      content: thumb
    };

    render(<ThumbnailWrapper {...thumbnailWrapperProps} />);
    expect(screen.getAllByTestId("thumbnail-wrapper")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-button")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-title")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
  });

  it("renders wrapper without saved title icon", () => {
    const thumbnailWrapperProps: IThumbnailWrapperProps= {
      selected: true,
      setSelectedContainerId: (containerId: string) => undefined,
      clearContainer: (containerId: string) => undefined,
      content: thumb
    };

    render(<ThumbnailWrapper { ...thumbnailWrapperProps } />);
    expect(screen.getAllByTestId("thumbnail-wrapper")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-button")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail-title")).toHaveLength(1);
    expect(screen.getAllByTestId("thumbnail")).toHaveLength(1);
  });
});
