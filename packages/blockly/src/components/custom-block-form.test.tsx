import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { CustomBlockForm } from "./custom-block-form";
import { ICustomBlock, CustomBlockType } from "./types";

jest.mock("./custom-block-form.scss", () => ({}));

describe("CustomBlockForm", () => {
  const mockOnSubmit = jest.fn();
  const mockExistingBlocks: ICustomBlock[] = [
    {
      id: "custom_set_color_1234567890",
      type: "setter",
      name: "color",
      color: "#FF0000",
      category: "Properties",
      config: {
        typeOptions: [["red", "RED"], ["blue", "BLUE"]],
        includeNumberInput: false
      }
    }
  ];

  const defaultProps = {
    blockType: "setter" as CustomBlockType,
    existingBlocks: mockExistingBlocks,
    onSubmit: mockOnSubmit,
    toolbox: `{
      "kind": "categoryToolbox",
      "contents": [
        {
          "kind": "category",
          "name": "Properties",
          "contents": []
        },
        {
          "kind": "category", 
          "name": "General",
          "contents": []
        }
      ]
    }`
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe("Form Labels and Fields", () => {
    it("shows 'Property Name' label for setter blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);
      expect(screen.getByText("Property Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., color, speed")).toBeInTheDocument();
    });

    it("shows 'Object Name' label for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      expect(screen.getByText("Object Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., molecules, people")).toBeInTheDocument();
    });

    it("does not show Type Label field", () => {
      render(<CustomBlockForm {...defaultProps} />);
      expect(screen.queryByText("Type Label")).not.toBeInTheDocument();
    });

    it("shows category selector with available categories", () => {
      render(<CustomBlockForm {...defaultProps} />);
      expect(screen.getByText("Toolbox Category")).toBeInTheDocument();
      expect(screen.getByText("Properties")).toBeInTheDocument();
      expect(screen.getByText("General")).toBeInTheDocument();
    });
  });

  describe("Setter Block Specific Fields", () => {
    it("shows include number input checkbox for setter blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);
      expect(screen.getByText("Include Number Input (math_number)")).toBeInTheDocument();
    });

    it("does not show count fields for setter blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);
      expect(screen.queryByText("Min Count")).not.toBeInTheDocument();
      expect(screen.queryByText("Max Count")).not.toBeInTheDocument();
      expect(screen.queryByText("Default Count")).not.toBeInTheDocument();
    });
  });

  describe("Creator Block Specific Fields", () => {
    it("shows count fields for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      expect(screen.getByText("Include Count Slider")).toBeInTheDocument();
      expect(screen.getByText("Min Count")).toBeInTheDocument();
      expect(screen.getByText("Max Count")).toBeInTheDocument();
      expect(screen.getByText("Default Count")).toBeInTheDocument();
    });

    it("shows child blocks selector for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      expect(screen.getByText("Child Setter Blocks")).toBeInTheDocument();
    });

    it("does not show include number input checkbox for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      expect(screen.queryByText("Include Number Input (math_number)")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("validates required fields", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);

      await user.click(screen.getByRole("button", { name: "Add Block" }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("validates category selection", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);

      await user.type(screen.getByLabelText(/Property Name/), "test");
      await user.selectOptions(screen.getByRole("combobox"), "");
      await user.click(screen.getByRole("button", { name: "Add Block" }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Options Management", () => {
    it("allows adding and removing options", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);

      await user.click(screen.getByText("Add Option"));

      const labelInputs = screen.getAllByPlaceholderText("Label");
      const valueInputs = screen.getAllByPlaceholderText("Value");

      expect(labelInputs).toHaveLength(2);
      expect(valueInputs).toHaveLength(2);

      await user.type(labelInputs[1], "fast");
      await user.type(valueInputs[1], "FAST");
      await user.click(screen.getAllByText("Remove")[0]);
      
      expect(screen.getAllByPlaceholderText("Label")).toHaveLength(1);
      expect(screen.getAllByPlaceholderText("Value")).toHaveLength(1);
    });
  });

  describe("Editing Existing Blocks", () => {
    const editingBlock: ICustomBlock = {
      id: "custom_set_color_1234567890",
      type: "setter",
      name: "color",
      color: "#FF0000",
      category: "Properties",
      config: {
        typeOptions: [["red", "RED"], ["blue", "BLUE"]],
        includeNumberInput: true
      }
    };

    it("populates form with existing block data", () => {
      render(<CustomBlockForm {...defaultProps} editingBlock={editingBlock} />);
      
      expect(screen.getByDisplayValue("color")).toBeInTheDocument();
      expect(screen.getByDisplayValue("red")).toBeInTheDocument();
      expect(screen.getByDisplayValue("RED")).toBeInTheDocument();
      expect(screen.getByDisplayValue("blue")).toBeInTheDocument();
      expect(screen.getByDisplayValue("BLUE")).toBeInTheDocument();
    });

    it("shows 'Update Block' button when editing", () => {
      render(<CustomBlockForm {...defaultProps} editingBlock={editingBlock} />);
      expect(screen.getByRole("button", { name: "Update Block" })).toBeInTheDocument();
    });
  });

  describe("Category Extraction", () => {
    it("handles empty toolbox gracefully", () => {
      render(<CustomBlockForm {...defaultProps} toolbox="" />);
      expect(screen.getByText("Select a category...")).toBeInTheDocument();
    });

    it("handles invalid toolbox JSON gracefully", () => {
      render(<CustomBlockForm {...defaultProps} toolbox="invalid json" />);
      expect(screen.getByText("Select a category...")).toBeInTheDocument();
    });

    it("extracts categories from toolbox", () => {
      render(<CustomBlockForm {...defaultProps} />);
      expect(screen.getByText("Properties")).toBeInTheDocument();
      expect(screen.getByText("General")).toBeInTheDocument();
    });
  });
});
