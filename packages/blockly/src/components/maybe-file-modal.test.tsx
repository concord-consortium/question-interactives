import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MaybeFileModal } from "./maybe-file-modal";
import { ISavedBlocklyState } from "./types";
import { FileModal } from "./header";

jest.mock("./maybe-file-modal.scss", () => ({}));
jest.mock("@concord-consortium/question-interactives-helpers/src/components/modal", () => ({
  Modal: ({ title, message, confirmLabel, onConfirm, onCancel }: any) => (
    <div data-testid="modal">
      <div data-testid="modal-title">{title}</div>
      <div data-testid="modal-message">{message}</div>
      <button data-testid="modal-confirm" onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button data-testid="modal-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

describe("MaybeFileModal", () => {
  const mockSetFileModal = jest.fn();
  const mockHandleFileNew = jest.fn();
  const mockHandleFileOpen = jest.fn();
  const mockHandleFileCopy = jest.fn();
  const mockHandleFileRename = jest.fn();
  const mockHandleFileDelete = jest.fn();

  const savedBlocklyStates: ISavedBlocklyState[] = [
    { name: "Model 1", blocklyState: "{}" },
    { name: "Model 2", blocklyState: "{}" },
    { name: "My Custom Model", blocklyState: "{}" },
  ];

  const defaultProps = {
    setFileModal: mockSetFileModal,
    savedBlocklyStates,
    handleFileNew: mockHandleFileNew,
    handleFileOpen: mockHandleFileOpen,
    handleFileCopy: mockHandleFileCopy,
    handleFileRename: mockHandleFileRename,
    handleFileDelete: mockHandleFileDelete,
    name: "Model 1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("No Modal State", () => {
    it("returns null when fileModal is undefined", () => {
      const { container } = render(
        <MaybeFileModal {...defaultProps} fileModal={undefined} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("New Model Modal", () => {
    it("renders the new model modal", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);
      expect(screen.getByTestId("modal-title")).toHaveTextContent("New Model");
      expect(screen.getByText("Name your new model:")).toBeInTheDocument();
      expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Save");
    });

    it("sets default name to next model number", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 3");
    });

    it("calculates next model number correctly with gaps", () => {
      const statesWithGaps: ISavedBlocklyState[] = [
        { name: "Model 1", blocklyState: "{}" },
        { name: "Model 5", blocklyState: "{}" },
        { name: "Model 3", blocklyState: "{}" },
      ];
      render(
        <MaybeFileModal
          {...defaultProps}
          savedBlocklyStates={statesWithGaps}
          fileModal="new"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 6");
    });

    it("handles empty saved states", () => {
      render(
        <MaybeFileModal
          {...defaultProps}
          savedBlocklyStates={[]}
          fileModal="new"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 2");
    });

    it("handles non-sequential model names", () => {
      const mixedStates: ISavedBlocklyState[] = [
        { name: "Custom Name", blocklyState: "{}" },
        { name: "Model 2", blocklyState: "{}" },
        { name: "Another Model", blocklyState: "{}" },
      ];
      render(
        <MaybeFileModal
          {...defaultProps}
          savedBlocklyStates={mixedStates}
          fileModal="new"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 3");
    });

    it("calls handleFileNew with trimmed input value on confirm", () => {
      mockHandleFileNew.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);

      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "  New Test Model  " } });

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileNew).toHaveBeenCalledWith("New Test Model");
    });

    it("closes modal when handleFileNew returns true", () => {
      mockHandleFileNew.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("does not close modal when handleFileNew returns false", () => {
      mockHandleFileNew.mockReturnValue(false);
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).not.toHaveBeenCalled();
    });

    it("closes modal on cancel", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);

      const cancelButton = screen.getByTestId("modal-cancel");
      fireEvent.click(cancelButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("handles empty input value", () => {
      mockHandleFileNew.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);

      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "   " } });

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileNew).toHaveBeenCalledWith("");
    });
  });

  describe("Open Model Modal", () => {
    it("renders the open model modal", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Open Model");
      expect(screen.getByText("Select a model to open:")).toBeInTheDocument();
      expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Open");
    });

    it("shows all saved models except current one", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);
      const select = screen.getByTestId("model-select") as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.value);

      expect(options).toContain("Model 2");
      expect(options).toContain("My Custom Model");
      expect(options).not.toContain("Model 1");
    });

    it("renders correct number of options", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);
      const select = screen.getByTestId("model-select") as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });

    it("calls handleFileOpen with selected value on confirm", () => {
      mockHandleFileOpen.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);

      const select = screen.getByTestId("model-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "Model 2" } });

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileOpen).toHaveBeenCalledWith("Model 2");
    });

    it("closes modal when handleFileOpen returns true", () => {
      mockHandleFileOpen.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("does not close modal when handleFileOpen returns false", () => {
      mockHandleFileOpen.mockReturnValue(false);
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).not.toHaveBeenCalled();
    });

    it("closes modal on cancel", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);

      const cancelButton = screen.getByTestId("modal-cancel");
      fireEvent.click(cancelButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("handles case with only one saved state", () => {
      const singleState: ISavedBlocklyState[] = [
        { name: "Model 1", blocklyState: "{}" },
      ];
      render(
        <MaybeFileModal
          {...defaultProps}
          savedBlocklyStates={singleState}
          fileModal="open"
        />
      );
      const select = screen.getByTestId("model-select") as HTMLSelectElement;
      expect(select.options.length).toBe(0);
    });
  });

  describe("Copy Model Modal", () => {
    it("renders the copy model modal", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="copy" />);
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Make a Copy");
      expect(screen.getByText("Create a copy of the model:")).toBeInTheDocument();
      expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Save");
    });

    it("sets default name with 'Copy of' prefix", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="copy" />);
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Copy of Model 1");
    });

    it("calls handleFileCopy with trimmed input value on confirm", () => {
      mockHandleFileCopy.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="copy" />);

      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "  Model 1 Copy  " } });

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileCopy).toHaveBeenCalledWith("Model 1 Copy");
    });

    it("closes modal when handleFileCopy returns true", () => {
      mockHandleFileCopy.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="copy" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("does not close modal when handleFileCopy returns false", () => {
      mockHandleFileCopy.mockReturnValue(false);
      render(<MaybeFileModal {...defaultProps} fileModal="copy" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).not.toHaveBeenCalled();
    });

    it("closes modal on cancel", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="copy" />);

      const cancelButton = screen.getByTestId("modal-cancel");
      fireEvent.click(cancelButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("handles different model names", () => {
      render(
        <MaybeFileModal
          {...defaultProps}
          name="My Special Model"
          fileModal="copy"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Copy of My Special Model");
    });
  });

  describe("Rename Model Modal", () => {
    it("renders the rename model modal", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="rename" />);
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Rename Model");
      expect(screen.getByText("Edit the name of your model:")).toBeInTheDocument();
      expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Save");
    });

    it("sets default name to current name", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="rename" />);
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 1");
    });

    it("calls handleFileRename with trimmed input value on confirm", () => {
      mockHandleFileRename.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="rename" />);

      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "  Renamed Model  " } });

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileRename).toHaveBeenCalledWith("Renamed Model");
    });

    it("closes modal when handleFileRename returns true", () => {
      mockHandleFileRename.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="rename" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("does not close modal when handleFileRename returns false", () => {
      mockHandleFileRename.mockReturnValue(false);
      render(<MaybeFileModal {...defaultProps} fileModal="rename" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).not.toHaveBeenCalled();
    });

    it("closes modal on cancel", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="rename" />);

      const cancelButton = screen.getByTestId("modal-cancel");
      fireEvent.click(cancelButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("preserves current name for different models", () => {
      render(
        <MaybeFileModal
          {...defaultProps}
          name="My Custom Model"
          fileModal="rename"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("My Custom Model");
    });
  });

  describe("Delete Model Modal", () => {
    it("renders the delete model modal", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="delete" />);
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Delete Model");
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Delete");
    });

    it("displays the model name in the message", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="delete" />);
      expect(screen.getByText("Model 1")).toBeInTheDocument();
    });

    it("calls handleFileDelete on confirm", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="delete" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileDelete).toHaveBeenCalledTimes(1);
    });

    it("closes modal after delete confirmation", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="delete" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("closes modal on cancel without calling handleFileDelete", () => {
      render(<MaybeFileModal {...defaultProps} fileModal="delete" />);

      const cancelButton = screen.getByTestId("modal-cancel");
      fireEvent.click(cancelButton);

      expect(mockHandleFileDelete).not.toHaveBeenCalled();
      expect(mockSetFileModal).toHaveBeenCalledWith(undefined);
    });

    it("handles different model names in delete message", () => {
      render(
        <MaybeFileModal
          {...defaultProps}
          name="Important Model"
          fileModal="delete"
        />
      );
      expect(screen.getByText("Important Model")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles null ref values gracefully in new modal", () => {
      mockHandleFileNew.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="new" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      // Should still be called, even with empty/trimmed value
      expect(mockHandleFileNew).toHaveBeenCalled();
    });

    it("handles null ref values gracefully in open modal", () => {
      mockHandleFileOpen.mockReturnValue(true);
      render(<MaybeFileModal {...defaultProps} fileModal="open" />);

      const confirmButton = screen.getByTestId("modal-confirm");
      fireEvent.click(confirmButton);

      expect(mockHandleFileOpen).toHaveBeenCalled();
    });

    it("returns null for invalid fileModal type", () => {
      const { container } = render(
        <MaybeFileModal {...defaultProps} fileModal={"invalid" as FileModal} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("handles model names with special characters", () => {
      render(
        <MaybeFileModal
          {...defaultProps}
          name="Model #1 (v2.0)"
          fileModal="copy"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Copy of Model #1 (v2.0)");
    });

    it("handles very long model names", () => {
      const longName = "A".repeat(100);
      render(
        <MaybeFileModal
          {...defaultProps}
          name={longName}
          fileModal="rename"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe(longName);
    });

    it("handles model names with only whitespace for Model N detection", () => {
      const statesWithWhitespace: ISavedBlocklyState[] = [
        { name: "   ", blocklyState: "{}" },
        { name: "Model 1", blocklyState: "{}" },
      ];
      render(
        <MaybeFileModal
          {...defaultProps}
          savedBlocklyStates={statesWithWhitespace}
          fileModal="new"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 2");
    });

    it("handles case-insensitive model number detection", () => {
      const caseInsensitiveStates: ISavedBlocklyState[] = [
        { name: "model 1", blocklyState: "{}" },
        { name: "MODEL 2", blocklyState: "{}" },
        { name: "MoDel 3", blocklyState: "{}" },
      ];
      render(
        <MaybeFileModal
          {...defaultProps}
          savedBlocklyStates={caseInsensitiveStates}
          fileModal="new"
        />
      );
      const input = screen.getByTestId("model-name-input") as HTMLInputElement;
      expect(input.value).toBe("Model 4");
    });
  });
});
