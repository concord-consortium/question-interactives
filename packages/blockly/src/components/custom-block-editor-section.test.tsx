import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CustomBlockEditorSection, generateBlockId } from "./custom-block-editor-section";

const mockOnChange = jest.fn();
const mockBlocks = [
	{
    category: "Properties",
    color: "#ff0000",
    config: {
			canHaveChildren: false,
			typeOptions: [
				["red", "RED"] as [string, string]
			]
		},
		id: "custom_set_color_1",
		name: "color",
		type: "setter" as const,
	},
	{
		category: "General",
		color: "#00ff00",
		config: { 
			canHaveChildren: true,
			childBlocks: ["custom_set_color_1"],
			defaultCount: 100,
			maxCount: 500,
			minCount: 0,
			typeOptions: [
				["water", "WATER"] as [string, string]
			]
		},
		id: "custom_create_molecules_2",
		name: "molecules",
		type: "creator" as const,
	}
];

const defaultProps = {
	customBlocks: mockBlocks,
	toolbox: "{}",
	onChange: mockOnChange
};

describe("Rendering", () => {
	it("renders the section heading and add button", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.getByText(/Set Properties Blocks/)).toBeInTheDocument();
		expect(screen.getByTestId("add-setter")).toBeInTheDocument();
	});

	it("shows no blocks message when empty", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="action" customBlocks={[]} />);

		expect(screen.getByText(/No action blocks created yet/i)).toBeInTheDocument();
	});

	it("renders existing blocks for the given type", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.getByText(/color/)).toBeInTheDocument();
		expect(screen.getByTestId("current-setter")).toBeInTheDocument();
	});
});

describe("Block Management", () => {
	it("shows edit and delete buttons for each block", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.getByTestId("block-edit")).toBeInTheDocument();
		expect(screen.getByTestId("block-delete")).toBeInTheDocument();
	});

	it("calls onChange when delete is clicked", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		await user.click(screen.getByTestId("block-delete"));
		expect(mockOnChange).toHaveBeenCalled();
	});

	it("shows and hides the add/edit form when add/cancel is clicked", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);
		const addButton = screen.getByTestId("add-setter");

		expect(screen.queryByTestId("custom-block-form")).not.toBeInTheDocument();
  
		await user.click(addButton);
		expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();

		await user.click(addButton);
		expect(screen.queryByTestId("custom-block-form")).not.toBeInTheDocument();
	});
});

describe("ID Generation", () => {
  it("generates descriptive IDs for setter blocks", () => {
    const setterBlock = {
      category: "Properties",
      color: "#ff0000",
      config: {
        canHaveChildren: false,
      },
      id: "",
      name: "speed limit",
      type: "setter" as const,
    };
    const id = generateBlockId(setterBlock);
    expect(id).toMatch(/^custom_setter_speed_limit_\d+$/);
  });

  it("generates descriptive IDs for creator blocks", () => {
    const creatorBlock = {
      category: "General",
      color: "#00ff00",
      config: {
      canHaveChildren: true,
      },
      id: "",
      name: "water particles",
      type: "creator" as const,
    };
    const id = generateBlockId(creatorBlock);
    expect(id).toMatch(/^custom_creator_water_particles_\d+$/);
  });
});
