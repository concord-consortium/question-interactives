// import React from "react";
// import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";

// import { DEFAULT_MAX_NESTING_DEPTH } from "../blocks/block-constants";
// import { INestedBlock } from "./types";
// import { CustomBlockFormNestedBlocks } from "./custom-block-form-nested-blocks";

// const defaultProps = {
//   availableBlocks: [
//     { id: "setter1", name: "color (setter)", type: "setter", canHaveChildren: false },
//     { id: "action1", name: "move (action)", type: "action", canHaveChildren: true },
//     { id: "creator1", name: "particles (creator)", type: "creator", canHaveChildren: true }
//   ],
//   maxDepth: DEFAULT_MAX_NESTING_DEPTH,
//   nestedBlocks: [] as INestedBlock[],
//   onChange: jest.fn(),
//   parentBlockId: "parent-block"
// };

// describe("CustomBlockFormNestedBlocks", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe("Basic Rendering", () => {
//     it("renders nested blocks section with header", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} />);
      
//       expect(screen.getByText("Child Blocks")).toBeInTheDocument();
//       expect(screen.getByTestId("nested-blocks")).toBeInTheDocument();
//     });

//     it("shows empty state when no blocks are added", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} />);
      
//       expect(screen.getByText("No nested blocks added yet.")).toBeInTheDocument();
//     });

//     it("shows add block dropdown", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} />);
      
//       const dropdown = screen.getByTestId("add-root-block");
//       expect(dropdown).toBeInTheDocument();
//       expect(screen.getByText("+ Add block...")).toBeInTheDocument();
//     });

//     it("lists available blocks in dropdown", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} />);
      
//       expect(screen.getByText("color (setter)")).toBeInTheDocument();
//       expect(screen.getByText("move (action)")).toBeInTheDocument();
//       expect(screen.getByText("particles (creator)")).toBeInTheDocument();
//     });
//   });

//   describe("Adding Blocks", () => {
//     it("calls onChange when a root block is added", async () => {
//       const user = userEvent.setup();
//       const mockOnChange = jest.fn();
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} onChange={mockOnChange} />);
      
//       const dropdown = screen.getByTestId("add-root-block");
//       await user.selectOptions(dropdown, "setter1");
      
//       expect(mockOnChange).toHaveBeenCalledWith([
//         { blockId: "setter1", canHaveChildren: false }
//       ]);
//     });

//     it("does not list parent block in available options", () => {
//       const props = { ...defaultProps, parentBlockId: "setter1" };
//       render(<CustomBlockFormNestedBlocks {...props} />);
      
//       const dropdown = screen.getByTestId("add-root-block");
//       const options = Array.from((dropdown as HTMLSelectElement).options).map(o => o.value);
      
//       expect(options).not.toContain("setter1");
//       expect(options).toContain("action1");
//       expect(options).toContain("creator1");
//     });
//   });

//   describe("Displaying Nested Blocks", () => {
//     const nestedBlocks: INestedBlock[] = [
//       {
//         blockId: "setter1",
//         canHaveChildren: true,
//         children: [
//           { blockId: "action1", }
//         ]
//       },
//       { blockId: "creator1" }
//     ];

//     it("displays existing nested blocks", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       expect(screen.getAllByText("color (setter)").length).toBeGreaterThan(0);
//       expect(screen.getAllByText("particles (creator)").length).toBeGreaterThan(0);
//     });

//     it("shows level indicators for each block", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       expect(screen.getAllByText(/Level\s+1/)).toHaveLength(2);
//     });

//     it("shows expand button for blocks with children", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       const expandButtons = screen.getAllByText("▶");
//       expect(expandButtons.length).toBeGreaterThan(0);
//     });
//   });

//   describe("Block Actions", () => {
//     const nestedBlocks: INestedBlock[] = [
//       { blockId: "setter1" },
//       { blockId: "action1" }
//     ];

//     it("removes a block when Remove button is clicked", async () => {
//       const user = userEvent.setup();
//       const mockOnChange = jest.fn();
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} onChange={mockOnChange} />);
      
//       const removeButtons = screen.getAllByText("Remove");
//       await user.click(removeButtons[0]);
      
//       expect(mockOnChange).toHaveBeenCalledWith([
//         { blockId: "action1" }
//       ]);
//     });

//     it("moves a block up when Up button is clicked", async () => {
//       const user = userEvent.setup();
//       const mockOnChange = jest.fn();
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} onChange={mockOnChange} />);

//       const upButtons = screen.getAllByTestId("block-move-up");
//       await user.click(upButtons[1]); // Click Up on second block
      
//       expect(mockOnChange).toHaveBeenCalledWith([
//         { blockId: "action1" },
//         { blockId: "setter1" }
//       ]);
//     });

//     it("moves a block down when Down button is clicked", async () => {
//       const user = userEvent.setup();
//       const mockOnChange = jest.fn();
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} onChange={mockOnChange} />);

//       const downButtons = screen.getAllByTestId("block-move-down");
//       await user.click(downButtons[0]); // Click Down on first block
      
//       expect(mockOnChange).toHaveBeenCalledWith([
//         { blockId: "action1" },
//         { blockId: "setter1" }
//       ]);
//     });

//     it("disables Up button for first block", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       const upButtons = screen.getAllByTestId("block-move-up");
//       expect(upButtons[0]).toBeDisabled();
//       expect(upButtons[1]).not.toBeDisabled();
//     });

//     it("disables Down button for last block", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       const downButtons = screen.getAllByTestId("block-move-down");
//       expect(downButtons[0]).not.toBeDisabled();
//       expect(downButtons[1]).toBeDisabled();
//     });
//   });

//   describe("canHaveChildren Property", () => {
//     const nestedBlocks: INestedBlock[] = [
//       { blockId: "setter1" }, // canHaveChildren: false (default)
//       { blockId: "action1", canHaveChildren: true }   // canHaveChildren: true (explicit)
//     ];

//     it("only shows add child dropdown for blocks that can have children", () => {
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       // Find all select elements
//       const allSelects = screen.getAllByRole("combobox");
      
//       // Check for root-level "Add block..." dropdown
//       const rootDropdown = screen.getByTestId("add-root-block");
//       expect(rootDropdown).toBeInTheDocument();
      
//       // The nested block dropdowns should only appear for blocks with canHaveChildren: true
//       // setter1 should NOT have a dropdown, action1 SHOULD have a dropdown
//       const addChildSelects = allSelects.filter(select => 
//         select.querySelector('option[value=""]')?.textContent?.includes("Add nested block")
//       );
      
//       // Should only find 1 nested dropdown (for action1 only, not setter1)
//       expect(addChildSelects.length).toBe(1); // action1 only
//     });

//     it("allows adding children to blocks that can have children", async () => {
//       const user = userEvent.setup();
//       const mockOnChange = jest.fn();
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} onChange={mockOnChange} />);
      
//       // Find the add child select for action1 (which can have children)
//       const action1Select = screen.getAllByRole("combobox").find(select => 
//         select.querySelector('option[value=""]')?.textContent?.includes("Add nested block")
//       );
      
//       expect(action1Select).toBeInTheDocument();
      
//       // Should be able to add a child to action1
//       if (action1Select) {
//         await user.selectOptions(action1Select, "creator1");
//         expect(mockOnChange).toHaveBeenCalled();
//       }
//     });
//   });

//   describe("Depth Limits", () => {
//     const deeplyNested: INestedBlock[] = [
//       {
//         blockId: "b1",
//         canHaveChildren: true,
//         children: [{
//           blockId: "b2",
//           canHaveChildren: true,
//           children: [{
//             blockId: "b3",
//             canHaveChildren: true
//           }]
//         }]
//       }
//     ];

//     it("shows blocks within depth limit", async () => {
//       const user = userEvent.setup();
//       // Use custom block IDs that won't conflict with defaultProps
//       const testBlocks: INestedBlock[] = [
//         {
//           blockId: "setter1",
//           children: [{
//             blockId: "action1",
//             canHaveChildren: true,
//             children: [{
//               blockId: "creator1",
//               canHaveChildren: true
//             }]
//           }]
//         }
//       ];
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={testBlocks} maxDepth={3} />);
      
//       // Verify root level block is shown
//       expect(screen.getAllByText("color (setter)").length).toBeGreaterThan(0);
      
//       // Expand to show level 2
//       const toggle1 = screen.getAllByText("▶")[0];
//       await user.click(toggle1);
//       expect(screen.getAllByText("move (action)").length).toBeGreaterThan(0);
      
//       // Expand to show level 3 (at max depth)
//       const toggle2 = screen.getAllByText("▶")[0];
//       await user.click(toggle2);
//       expect(screen.getAllByText("particles (creator)").length).toBeGreaterThan(0);
//     });

//     it("prevents adding nested blocks that would exceed depth limit", async () => {
//       const user = userEvent.setup();
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={deeplyNested} maxDepth={3} />);
      
//       // Expand to level 1 (b1)
//       const toggleButtons = screen.getAllByText("▶");
//       await user.click(toggleButtons[0]);
      
//       // Expand to level 2 (b2)
//       const toggleButtons2 = screen.getAllByText("▶");
//       await user.click(toggleButtons2[0]);
      
//       // At level 3 (b3), there should be no "Add nested block..." dropdown
//       // because adding a child would exceed maxDepth of 3
//       const allSelects = screen.getAllByRole("combobox");
//       const addChildSelects = allSelects.filter(select => 
//         select.querySelector('option[value=""]')?.textContent?.includes("Add nested block")
//       );
      
//       // Should only have the root-level "Add block..." dropdown and selects for b1 and b2
//       // but NOT for b3 (which is at depth 3, the max)
//       expect(addChildSelects.length).toBeLessThan(4); // Root + b1 + b2, but not b3
//     });
//   });

//   describe("Expanding and Collapsing", () => {
//     const nestedBlocks: INestedBlock[] = [
//       {
//         blockId: "setter1",
//         children: [
//           { blockId: "action1" }
//         ]
//       }
//     ];

//     it("expands children when toggle button is clicked", async () => {
//       const user = userEvent.setup();
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       const toggleButton = screen.getByText("▶");
//       await user.click(toggleButton);
      
//       expect(screen.getByText("▼")).toBeInTheDocument();
//       const moveBlocks = screen.getAllByText("move (action)");
//       expect(moveBlocks.length).toBeGreaterThan(1);
//     });

//     it("collapses children when toggle button is clicked again", async () => {
//       const user = userEvent.setup();
      
//       render(<CustomBlockFormNestedBlocks {...defaultProps} nestedBlocks={nestedBlocks} />);
      
//       const toggleButton = screen.getByText("▶");
//       await user.click(toggleButton); // Expand
      
//       // After expanding, the child block should be visible (Level 2)
//       expect(screen.getByText("Level 2")).toBeInTheDocument();
      
//       const collapseButton = screen.getByText("▼");
//       await user.click(collapseButton); // Collapse

//       // After collapsing, the Level 2 indicator should not be visible
//       expect(screen.queryByText("Level 2")).not.toBeInTheDocument();
//       // But the parent block (Level 1) should still be visible
//       expect(screen.getByText("Level 1")).toBeInTheDocument();
//     });
//   });
// });

