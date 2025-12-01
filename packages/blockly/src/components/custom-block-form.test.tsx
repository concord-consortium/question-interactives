import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { availableChildBlocks } from "../utils/block-utils";
import { extractCategoriesFromToolbox } from "../utils/toolbox-utils";
import { CustomBlockForm } from "./custom-block-form";
import { ICustomBlock, CustomBlockType } from "./types";

jest.mock("./custom-block-form.scss", () => ({}));
jest.mock("../utils/block-utils", () => ({
  availableChildBlocks: jest.fn()
}));
jest.mock("../utils/toolbox-utils", () => ({
  extractCategoriesFromToolbox: jest.fn()
}));

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
        canHaveChildren: false,
        typeOptions: [["red", "RED"], ["blue", "BLUE"]]
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
    (availableChildBlocks as jest.Mock).mockReturnValue([]);
    (extractCategoriesFromToolbox as jest.Mock).mockReturnValue(["Properties", "General"]);
  });

  describe("Form Labels and Fields", () => {
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

  describe("Setter Block specific configuration", () => {
    it("shows common custom block fields", () => {
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);
      expect(screen.getByTestId("field-name")).toBeInTheDocument();
      expect(screen.getByTestId("field-color")).toBeInTheDocument();
      expect(screen.getByTestId("field-category")).toBeInTheDocument();
    });

    it("uses correct configuration for setter blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);
      expect(screen.getByText("Property Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., color, speed");
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
      expect(screen.getByTestId("section-include-number-input")).toBeInTheDocument();
    });

    it("does not show count fields for setter blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);
      expect(screen.queryByText("Min Count")).not.toBeInTheDocument();
      expect(screen.queryByText("Max Count")).not.toBeInTheDocument();
      expect(screen.queryByText("Default Count")).not.toBeInTheDocument();
    });
  });

  describe("Creator Block specific configuration", () => {
    it("shows common custom block fields", () => {
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);
      expect(screen.getByTestId("field-name")).toBeInTheDocument();
      expect(screen.getByTestId("field-color")).toBeInTheDocument();
      expect(screen.getByTestId("field-category")).toBeInTheDocument();
    });

    it("uses correct configuration for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      
      expect(screen.getByText("Object Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., molecules, people");
      expect(screen.getByText("Include Count Slider")).toBeInTheDocument();
      expect(screen.getByText("Min Count")).toBeInTheDocument();
      expect(screen.getByText("Max Count")).toBeInTheDocument();
      expect(screen.getByText("Default Count")).toBeInTheDocument();
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
      expect(screen.getByTestId("section-count-fields")).toBeInTheDocument();
      expect(screen.getByText("Child Blocks")).toBeInTheDocument();
    });

    it("does not show include number input checkbox for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      expect(screen.queryByText("Use Number Input Instead of Options")).not.toBeInTheDocument();
    });

    it("hides nested blocks UI when 'Contains Child Blocks' is unchecked", async () => {
      const user = userEvent.setup();
      (availableChildBlocks as jest.Mock).mockReturnValue([
        { id: "setter_1", name: "color", type: "setter", canHaveChildren: false }
      ]);

      render(<CustomBlockForm {...defaultProps} blockType="creator" />);

      const childrenCheckbox = screen.getByTestId("toggle-canHaveChildren");
      expect(childrenCheckbox).toBeChecked();
      expect(screen.queryByTestId("nested-blocks")).toBeInTheDocument();

      await user.click(childrenCheckbox);

      expect(childrenCheckbox).not.toBeChecked();
      expect(screen.queryByTestId("nested-blocks")).not.toBeInTheDocument();
    });
  });

  describe("Ask Block specific configuration", () => {
    it("shows common custom block fields", () => {
      render(<CustomBlockForm {...defaultProps} blockType="ask" />);
      expect(screen.getByTestId("field-name")).toBeInTheDocument();
      expect(screen.getByTestId("field-color")).toBeInTheDocument();
      expect(screen.getByTestId("field-category")).toBeInTheDocument();
    });

    it("uses correct configuration for ask blocks", async () => {
      render(<CustomBlockForm {...defaultProps} blockType="ask" />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByTestId("section-target-entity")).toBeInTheDocument();
      expect(screen.getByTestId("section-include-all-option")).toBeInTheDocument();
      expect(screen.getByTestId("section-show-target-entity-label")).toBeInTheDocument();
    });
  });

  describe("Action Block specific configuration", () => {
    it("shows common custom block fields", () => {
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      expect(screen.getByTestId("field-name")).toBeInTheDocument();
      expect(screen.getByTestId("field-color")).toBeInTheDocument();
      expect(screen.getByTestId("field-category")).toBeInTheDocument();
    });

    it("uses correct configuration for action blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      expect(screen.getByText("Action Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., bounce off, move forward");
      expect(screen.getByTestId("section-parameters")).toBeInTheDocument();
      expect(screen.getByTestId("add-param-select")).toBeInTheDocument();
      expect(screen.getByTestId("add-param-number")).toBeInTheDocument();
      expect(screen.getByTestId("section-include-condition-input")).toBeInTheDocument();
      expect(screen.getByTestId("section-can-have-children")).toBeInTheDocument();
      expect(screen.getByTestId("section-generator-template")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., \$\{ACTION\} \$\{DIRECTION\}/)).toBeInTheDocument();
    });
  });

  describe("Condition Block specific configuration", () => {
    it("shows common custom block fields", () => {
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);
      expect(screen.getByTestId("field-name")).toBeInTheDocument();
      expect(screen.getByTestId("field-color")).toBeInTheDocument();
      expect(screen.getByTestId("field-category")).toBeInTheDocument();
    });

    it("uses correct configuration for condition blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);

      expect(screen.getByText("Condition Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., touching, near, with");
      expect(screen.getByTestId("select-category")).toBeInTheDocument();
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
    });

    it("shows label position selector only when options exist", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);

      expect(screen.queryByTestId("section-condition-label-position")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("add-option"));
      await user.type(screen.getByTestId("option-label-0"), "touching");
      await user.type(screen.getByTestId("option-value-0"), "TOUCHING");

      expect(screen.getByTestId("section-condition-label-position")).toBeInTheDocument();
    });

    it("shows correct label position options", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);
      

      await user.click(screen.getByTestId("add-option"));
      await user.type(screen.getByTestId("option-label-0"), "touching");
      await user.type(screen.getByTestId("option-value-0"), "TOUCHING");

      const labelPositionSelect = screen.getByTestId("select-condition-label-position");
      expect(labelPositionSelect).toHaveValue("prefix");
      expect(screen.getByText("Before options")).toBeInTheDocument();
      expect(screen.getByText("After options")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("validates required fields", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);

      await user.click(screen.getByRole("button", { name: "Save Block" }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("validates category selection", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);

      await user.type(screen.getByLabelText(/Property Name/), "test");
      await user.selectOptions(screen.getByRole("combobox"), "");
      await user.click(screen.getByRole("button", { name: "Save Block" }));

      expect(mockOnSubmit).not.toHaveBeenCalled();
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
        canHaveChildren: false,
        typeOptions: [["red", "RED"], ["blue", "BLUE"]]
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

  describe("Parameter System", () => {
    it("adds select parameter fields when button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      
      await user.click(screen.getByTestId("add-param-select"));

      expect(screen.getByTestId("parameter-type-0")).toBeInTheDocument();
      expect(screen.getByTestId("parameter-type-0")).toHaveTextContent("Select Parameter");

      const nameInput = screen.getByTestId("param-name-0");
      const labelTextInput = screen.getByTestId("param-labelText-0");
      const positionSelect = screen.getByTestId("param-labelPosition-0");

      expect(nameInput).toBeInTheDocument();
      expect(labelTextInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute("placeholder", "e.g., DIRECTION");
      expect(labelTextInput).toHaveAttribute("placeholder", "e.g., Move");
      expect(positionSelect).toBeInTheDocument();
      expect(positionSelect).toHaveValue("prefix");
      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("adds number parameter when button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="action" />);

      await user.click(screen.getByTestId("add-param-number"));

      expect(screen.getByTestId("parameter-type-0")).toBeInTheDocument();
      expect(screen.getByTestId("parameter-type-0")).toHaveTextContent("Number Parameter");
      const nameInput = screen.getByTestId("param-name-0") as HTMLInputElement;
      const labelTextInput = screen.getByTestId("param-labelText-0");
      const positionSelect = screen.getByTestId("param-labelPosition-0");

      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute("placeholder", "e.g., DIRECTION");
      expect(labelTextInput).toHaveAttribute("placeholder", "e.g., Move");
      expect(positionSelect).toBeInTheDocument();
      expect(positionSelect).toHaveValue("prefix");
      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("removes parameter when remove button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      
      await user.click(screen.getByTestId("add-param-select"));
      expect(screen.getByTestId("parameter-type-0")).toBeInTheDocument();

      const parameterRemoveButton = screen.getByTestId("remove-param-0");
      await user.click(parameterRemoveButton);

      expect(screen.queryByTestId("parameter-type-0")).not.toBeInTheDocument();
    });
  });

  describe("Enhanced Form Validation", () => {
    it("validates action block requires generator template", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      
      await user.type(screen.getByLabelText(/Action Name/), "test");
      await user.selectOptions(screen.getByTestId("select-category"), "Properties");
      await user.click(screen.getByRole("button", { name: "Save Block" }));
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Category Extraction", () => {
    it("handles empty toolbox gracefully", () => {
      (extractCategoriesFromToolbox as jest.Mock).mockReturnValue([]);
      render(<CustomBlockForm {...defaultProps} toolbox="" />);
      expect(screen.getByText("Select a category...")).toBeInTheDocument();
    });

    it("handles invalid toolbox JSON gracefully", () => {
      (extractCategoriesFromToolbox as jest.Mock).mockReturnValue([]);
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
