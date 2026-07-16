import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";

import { IframeAuthoring } from "./iframe-authoring";

jest.mock("iframe-phone", () => ({
  ParentEndpoint: jest.fn(() => ({ disconnect: jest.fn(), post: jest.fn(), addListener: jest.fn() })),
}));

jest.mock("@concord-consortium/lara-interactive-api", () => ({
  getFirebaseJwt: jest.fn(),
}));

jest.mock("@concord-consortium/question-interactives-helpers/src/widgets/image-upload/image-upload-widget", () => ({
  ImageUploadComponent: () => <input data-testid="image-upload" />,
}));

const baseProps: any = {
  onChange: jest.fn(),
  formData: { libraryInteractiveId: "open-response", id: "1", authoredState: {} },
  formContext: { tokenServiceClient: {} },
};

afterEach(cleanup);

describe("IframeAuthoring collapsible header", () => {
  it("renders the Subquestion Authoring toggle as a button, collapsed by default", () => {
    const { getByRole } = render(<IframeAuthoring {...baseProps} />);
    const toggle = getByRole("button", { name: /Subquestion Authoring/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles aria-expanded when activated", () => {
    const { getByRole } = render(<IframeAuthoring {...baseProps} />);
    const toggle = getByRole("button", { name: /Subquestion Authoring/ });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the collapsed panel inert so its inputs stay out of the tab order, and clears it when opened", () => {
    const { getByRole, getAllByTestId } = render(<IframeAuthoring {...baseProps} />);
    // The image-upload inputs live inside the collapsible panel.
    const panelInput = getAllByTestId("image-upload")[0];
    expect(panelInput.closest("[inert]")).not.toBeNull();

    fireEvent.click(getByRole("button", { name: /Subquestion Authoring/ }));
    expect(panelInput.closest("[inert]")).toBeNull();
  });
});
