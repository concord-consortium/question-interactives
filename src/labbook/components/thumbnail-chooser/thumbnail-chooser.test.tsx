import React from "react";
import { render, screen } from "@testing-library/react";
import { IThumbnailChooserProps, ThumbnailChooser } from "./thumbnail-chooser";

describe("ThumbnailChooser component", () => {
  it("renders", () => {

    const Thumbnail = () => <div data-testid="thumbnail">Thumbnail</div>;

    const thumbnailChooserProps: IThumbnailChooserProps = {
      items: [{
        id: "a",
        empty: false,
        data: {}
      }],
      RenderingF: Thumbnail,
      selectedItemId: null,
      setSelectedItemId: (id: string) => null,
      clearSelectedItemId: (id: string) => null,
      maxDisplayItems: 4
    };

    render(<ThumbnailChooser {...thumbnailChooserProps} />);
    expect(screen.getByTestId("thumbnail-chooser")).toBeInTheDocument;
    expect(screen.getByTestId("thumbnail")).toBeInTheDocument;
  });
});
