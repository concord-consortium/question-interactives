import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CustomBlockFormOptionList } from "./custom-block-form-option-list";

const defaultProps = {
  options: [
    { label: "red", value: "RED" },
    { label: "blue", value: "BLUE" }
  ],
  onOptionsChange: jest.fn()
};

describe("CustomBlockFormOptionList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Options Display", () => {
    it("renders existing options with correct values", () => {
      render(<CustomBlockFormOptionList {...defaultProps} />);
      
      expect(screen.getByDisplayValue("red")).toBeInTheDocument();
      expect(screen.getByDisplayValue("RED")).toBeInTheDocument();
      expect(screen.getByDisplayValue("blue")).toBeInTheDocument();
      expect(screen.getByDisplayValue("BLUE")).toBeInTheDocument();
    });

    it("renders add option button", () => {
      render(<CustomBlockFormOptionList {...defaultProps} />);
      
      expect(screen.getByText("Add Option")).toBeInTheDocument();
      expect(screen.getByTestId("add-option")).toBeInTheDocument();
    });

    it("renders remove buttons for each option", () => {
      render(<CustomBlockFormOptionList {...defaultProps} />);
      
      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons).toHaveLength(2);
      expect(screen.getByTestId("remove-option-0")).toBeInTheDocument();
      expect(screen.getByTestId("remove-option-1")).toBeInTheDocument();
    });
  });

  describe("Adding Options", () => {
    it("adds new option when add button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnOptionsChange = jest.fn();
      
      render(
        <CustomBlockFormOptionList 
          {...defaultProps} 
          onOptionsChange={mockOnOptionsChange}
        />
      );
      
      await user.click(screen.getByTestId("add-option"));
      
      expect(mockOnOptionsChange).toHaveBeenCalledWith([
        { label: "red", value: "RED" },
        { label: "blue", value: "BLUE" },
        { label: "", value: "" }
      ]);
    });
  });

  describe("Removing Options", () => {
    it("removes option when remove button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnOptionsChange = jest.fn();
      
      render(
        <CustomBlockFormOptionList 
          {...defaultProps} 
          onOptionsChange={mockOnOptionsChange}
        />
      );
      
      await user.click(screen.getByTestId("remove-option-0"));
      
      expect(mockOnOptionsChange).toHaveBeenCalledWith([
        { label: "blue", value: "BLUE" }
      ]);
    });
  });

  describe("Editing Options", () => {
    it("calls onChange when option inputs are interacted with", async () => {
      const user = userEvent.setup();
      const mockOnOptionsChange = jest.fn();
      
      render(
        <CustomBlockFormOptionList 
          {...defaultProps} 
          onOptionsChange={mockOnOptionsChange}
        />
      );
      
      const labelInput = screen.getByTestId("option-label-0");
      const valueInput = screen.getByTestId("option-value-0");

      await user.click(labelInput);
      expect(labelInput).toBeInTheDocument();
      
      await user.click(valueInput);
      expect(valueInput).toBeInTheDocument();

      expect(labelInput).toHaveAttribute("placeholder", "Display text (e.g., blue)");
      expect(valueInput).toHaveAttribute("placeholder", "Value (e.g., BLUE)");
    });

    it("renders inputs with correct initial values", () => {
      const mockOnOptionsChange = jest.fn();
      
      render(
        <CustomBlockFormOptionList 
          {...defaultProps} 
          onOptionsChange={mockOnOptionsChange}
        />
      );
      
      expect(screen.getByDisplayValue("red")).toBeInTheDocument();
      expect(screen.getByDisplayValue("RED")).toBeInTheDocument();
      expect(screen.getByDisplayValue("blue")).toBeInTheDocument();
      expect(screen.getByDisplayValue("BLUE")).toBeInTheDocument();
    });
  });

  describe("Customizable Properties", () => {
    it("uses custom button text when provided", () => {
      render(
        <CustomBlockFormOptionList 
          {...defaultProps}
          addButtonText="Add New Option"
          removeButtonText="Delete"
        />
      );
      
      expect(screen.getByText("Add New Option")).toBeInTheDocument();
      expect(screen.getAllByText("Delete")).toHaveLength(2);
    });

    it("uses custom placeholders when provided", () => {
      render(
        <CustomBlockFormOptionList 
          {...defaultProps}
          labelPlaceholder="Custom label placeholder"
          valuePlaceholder="Custom value placeholder"
        />
      );
      
      expect(screen.getAllByPlaceholderText("Custom label placeholder")).toHaveLength(2);
      expect(screen.getAllByPlaceholderText("Custom value placeholder")).toHaveLength(2);
    });

    it("uses custom data test id prefix", () => {
      render(
        <CustomBlockFormOptionList 
          {...defaultProps}
          dataTestIdPrefix="custom"
        />
      );
      
      expect(screen.getByTestId("custom-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("custom-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("remove-custom-0")).toBeInTheDocument();
      expect(screen.getByTestId("custom-label-0")).toBeInTheDocument();
      expect(screen.getByTestId("custom-value-0")).toBeInTheDocument();
    });
  });

  describe("Parameter Options", () => {
    it("handles parameter options with custom prefix", async () => {
      const user = userEvent.setup();
      const mockOnOptionsChange = jest.fn();
      
      render(
        <CustomBlockFormOptionList 
          options={[{ label: "forward", value: "FORWARD" }]}
          dataTestIdPrefix="param-option-0"
          labelPlaceholder="Display text (e.g., forward)"
          valuePlaceholder="Value (e.g., FORWARD)"
          onOptionsChange={mockOnOptionsChange}
        />
      );
      
      expect(screen.getByTestId("param-option-0-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("remove-param-option-0-0")).toBeInTheDocument();
      expect(screen.getByDisplayValue("forward")).toBeInTheDocument();
      expect(screen.getByDisplayValue("FORWARD")).toBeInTheDocument();

      await user.click(screen.getByTestId("remove-param-option-0-0"));
      expect(mockOnOptionsChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty options array", () => {
      render(
        <CustomBlockFormOptionList 
          {...defaultProps}
          options={[]}
        />
      );
      
      expect(screen.getByText("Add Option")).toBeInTheDocument();
      expect(screen.queryByTestId("option-row-0")).not.toBeInTheDocument();
    });

    it("handles options with empty values", () => {
      render(
        <CustomBlockFormOptionList 
          {...defaultProps}
          options={[{ label: "", value: "" }]}
        />
      );
      
      const input = screen.getByTestId("option-label-0") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });
});
