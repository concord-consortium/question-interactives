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
			childBlocks: [{ blockId: "custom_set_color_1" }],
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

const additionalMockBlock = {
  category: "Properties",
  color: "#0000ff",
  config: { canHaveChildren: false, typeOptions: [["blue", "BLUE"] as [string, string]] },
  id: "custom_set_color_2",
  name: "background",
  type: "setter" as const,
};

const defaultProps = {
	customBlocks: mockBlocks,
	toolbox: "{}",
	onChange: mockOnChange
};

describe("Rendering", () => {
	it("renders the section heading, toggle button, and add button", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.getByText(/Set Properties Blocks/)).toBeInTheDocument();
		expect(screen.getByTestId("toggle-setter")).toBeInTheDocument();
		expect(screen.getByTestId("add-setter")).toBeInTheDocument();
	});

	it("is collapsed by default", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.queryByTestId("current-setter")).not.toBeInTheDocument();
	});

	it("expands when toggle button is clicked", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		await user.click(screen.getByTestId("toggle-setter"));
		
		expect(screen.getByTestId("current-setter")).toBeInTheDocument();
	});

	it("shows block count in header", () => {
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.getByText(/\(1 block\)/)).toBeInTheDocument();
	});

	it("pluralizes block count correctly", () => {
		const multipleBlocks = [
			...mockBlocks,
			additionalMockBlock
		];
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" customBlocks={multipleBlocks} />);

		expect(screen.getByText(/\(2 blocks\)/)).toBeInTheDocument();
	});

	it("shows no blocks message when empty and expanded", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="action" customBlocks={[]} />);

		await user.click(screen.getByTestId("toggle-action"));
		expect(screen.getByText(/No action blocks created yet/i)).toBeInTheDocument();
	});

	it("renders existing blocks for the given type when expanded", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		await user.click(screen.getByTestId("toggle-setter"));
		
		expect(screen.getByText(/color/)).toBeInTheDocument();
		expect(screen.getByTestId("current-setter")).toBeInTheDocument();
	});
});

describe("Block Management", () => {
	it("shows move, edit, and delete buttons for each block when expanded", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		await user.click(screen.getByTestId("toggle-setter"));

		expect(screen.getByTestId("block-move-up")).toBeInTheDocument();
		expect(screen.getByTestId("block-move-down")).toBeInTheDocument();
		expect(screen.getByTestId("block-edit")).toBeInTheDocument();
		expect(screen.getByTestId("block-delete")).toBeInTheDocument();
	});

	it("calls onChange when move buttons are clicked", async () => {
		const user = userEvent.setup();
		const multipleBlocks = [
			...mockBlocks,
			additionalMockBlock
		];
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" customBlocks={multipleBlocks} />);

		await user.click(screen.getByTestId("toggle-setter"));
		await user.click(screen.getAllByTestId("block-move-down")[0]);

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ id: "custom_set_color_2" }),
				expect.objectContaining({ id: "custom_set_color_1" })
			])
		);

		await user.click(screen.getAllByTestId("block-move-up")[1]);

		expect(mockOnChange).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ id: "custom_set_color_1" }),
				expect.objectContaining({ id: "custom_set_color_2" })
			])
		);
	});

	it("calls onChange when delete is clicked", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		await user.click(screen.getByTestId("toggle-setter"));
		await user.click(screen.getByTestId("block-delete"));
		
		expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.not.objectContaining({ id: "custom_set_color_1" })
      ])
    );
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

	it("auto-expands section when add button is clicked while collapsed", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		expect(screen.queryByTestId("current-setter")).not.toBeInTheDocument();

		await user.click(screen.getByTestId("add-setter"));

		expect(screen.getByTestId("current-setter")).toBeInTheDocument();
		expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
	});

	it("auto-expands section when edit is clicked", async () => {
		const user = userEvent.setup();
		render(<CustomBlockEditorSection {...defaultProps} blockType="setter" />);

		await user.click(screen.getByTestId("toggle-setter"));
		await user.click(screen.getByTestId("block-edit"));

		expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
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
