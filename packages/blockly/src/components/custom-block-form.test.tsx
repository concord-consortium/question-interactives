import { render, screen } from "@testing-library/react";
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

    it("shows 'Action Name' label for action blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      expect(screen.getByText("Action Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., bounce off, move forward")).toBeInTheDocument();
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
      expect(screen.getByText("Use Number Input Instead of Options")).toBeInTheDocument();
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
      expect(screen.getByText("Child Blocks")).toBeInTheDocument();
    });

    it("does not show include number input checkbox for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      expect(screen.queryByText("Use Number Input Instead of Options")).not.toBeInTheDocument();
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

  describe("Action Block Specific Fields", () => {
    it("shows common custom block fields", () => {
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      expect(screen.getByTestId("field-name")).toBeInTheDocument();
      expect(screen.getByTestId("field-color")).toBeInTheDocument();
      expect(screen.getByTestId("field-category")).toBeInTheDocument();
    });

    it("shows fields specific to action blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      expect(screen.getByTestId("section-parameters")).toBeInTheDocument();
      expect(screen.getByTestId("add-param-select")).toBeInTheDocument();
      expect(screen.getByTestId("add-param-number")).toBeInTheDocument();
      expect(screen.getByTestId("section-can-have-children")).toBeInTheDocument();
      expect(screen.getByTestId("section-generator-template")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., \$\{ACTION\} \$\{DIRECTION\}/)).toBeInTheDocument();
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
      await user.selectOptions(screen.getByRole("combobox"), "Properties");
      await user.click(screen.getByRole("button", { name: "Add Block" }));
      
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

  describe("Statement block functionality", () => {
    it("renders statement kind selector for statement blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="statement" />);
      
      expect(screen.getByTestId("section-statement-kind")).toBeInTheDocument();
      expect(screen.getByLabelText("Statement Type")).toBeInTheDocument();
      expect(screen.getByTestId("select-statement-kind")).toBeInTheDocument();
      const select = screen.getByTestId("select-statement-kind");
      expect(select).toHaveValue("custom");

      expect(screen.getByText("ask")).toBeInTheDocument();
      expect(screen.getByText("custom")).toBeInTheDocument();
    });

    it("shows target entity selector only for 'ask' statements", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="statement" />);
      
      expect(screen.queryByTestId("section-target-entity")).not.toBeInTheDocument();
      
      await user.selectOptions(screen.getByTestId("select-statement-kind"), "ask");
      expect(screen.getByTestId("section-target-entity")).toBeInTheDocument();
  
      await user.selectOptions(screen.getByTestId("select-statement-kind"), "custom");
      expect(screen.queryByTestId("section-target-entity")).not.toBeInTheDocument();
    });

    it("shows condition input checkbox for 'custom' statements", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="statement" />);
      
      expect(screen.getByTestId("section-include-condition-input")).toBeInTheDocument();
      expect(screen.getByLabelText("Include condition input (Boolean)")).not.toBeChecked();

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "custom");
      expect(screen.getByTestId("section-include-condition-input")).toBeInTheDocument();
      expect(screen.getByLabelText("Include condition input (Boolean)")).not.toBeChecked();

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "ask");
      expect(screen.queryByTestId("section-include-condition-input")).not.toBeInTheDocument();
    });

    it("shows code field only for custom statement kind", async () => {
      const user = userEvent.setup();
      render(<CustomBlockForm {...defaultProps} blockType="statement" />);

      expect(screen.getByTestId("section-generator-template")).toBeInTheDocument();

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "ask");
      expect(screen.queryByTestId("section-generator-template")).not.toBeInTheDocument();

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "custom");
      expect(screen.getByTestId("section-generator-template")).toBeInTheDocument();
    });

    it("clears target entity when switching away from ask", async () => {
      const user = userEvent.setup();
      const propsWithCreatorBlocks = {
        ...defaultProps,
        existingBlocks: [
          {
            id: "custom_create_molecules_123",
            type: "creator" as const,
            name: "molecules",
            color: "#312b84",
            category: "General",
            config: {
              canHaveChildren: true,
              childBlocks: [],
              defaultCount: 100,
              minCount: 0,
              maxCount: 500,
              typeOptions: [["water", "WATER"], ["air", "AIR"]] as [string, string][]
            }
          }
        ]
      };
      
      render(<CustomBlockForm {...propsWithCreatorBlocks} blockType="statement" />);

      expect(screen.queryByTestId("select-targetEntity")).not.toBeInTheDocument();

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "ask");
      expect(screen.getByTestId("select-targetEntity")).toBeInTheDocument();
      await user.selectOptions(screen.getByTestId("select-targetEntity"), "molecules");

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "custom");
      expect(screen.queryByTestId("select-targetEntity")).not.toBeInTheDocument();

      await user.selectOptions(screen.getByTestId("select-statement-kind"), "ask");
      expect(screen.getByTestId("select-targetEntity")).toHaveValue("");
    });
  });

  describe("Condition block functionality", () => {
    it("renders condition block form correctly", () => {
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);

      expect(screen.getByTestId("input-name")).toBeInTheDocument();
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

  describe("Block type configuration", () => {
    it("uses correct configuration for action blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="action" />);
      
      expect(screen.getByText("Action Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., bounce off, move forward");
      expect(screen.getByTestId("section-parameters")).toBeInTheDocument();
      expect(screen.getByTestId("section-generator-template")).toBeInTheDocument();
    });

    it("uses correct configuration for statement blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="statement" />);
      
      expect(screen.getByText("Statement Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., ask, repeat, when");
      expect(screen.getByTestId("section-statement-kind")).toBeInTheDocument();
    });

    it("uses correct configuration for condition blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="condition" />);
      
      expect(screen.getByText("Condition Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., touching, near, with");
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
    });

    it("uses correct configuration for creator blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="creator" />);
      
      expect(screen.getByText("Object Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., molecules, people");
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
      expect(screen.getByTestId("section-count-fields")).toBeInTheDocument();
    });

    it("uses correct configuration for setter blocks", () => {
      render(<CustomBlockForm {...defaultProps} blockType="setter" />);
      
      expect(screen.getByText("Property Name")).toBeInTheDocument();
      expect(screen.getByTestId("input-name")).toHaveAttribute("placeholder", "e.g., color, speed");
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
      expect(screen.getByTestId("section-include-number-input")).toBeInTheDocument();
    });
  });
});
