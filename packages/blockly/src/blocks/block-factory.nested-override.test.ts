import Blockly from "blockly/core";
import { registerCustomBlocks } from "./block-factory";
import {
  DISCLOSURE_LABEL_COLLAPSED, DISCLOSURE_LABEL_EXPANDED, DisclosureField
} from "./disclosure-field";
import { ICustomBlock } from "../components/types";

interface ICustomBlockWithXml extends Blockly.BlockSvg {
  __cachedChildrenCode: string | undefined;
  __disclosureOpen: boolean;
  __savedChildrenXml: string | undefined;
}

// Reads the real ARIA that a screen reader would see on the disclosure toggle. FieldImage
// publishes its alt text as the element's aria-label, and our subclass adds aria-expanded.
const disclosureAria = (block: Blockly.BlockSvg) => {
  const field = block.getField("__disclosure_icon");
  if (!(field instanceof DisclosureField)) throw new Error("disclosure field not found");
  const element = field.getFocusableElement();
  return {
    ariaExpanded: element.getAttribute("aria-expanded"),
    accessibleName: element.getAttribute("aria-label")
  };
};

describe("block-factory nested override", () => {
  let workspace: Blockly.WorkspaceSvg | null;
  let cb: ICustomBlockWithXml | null;

  beforeEach(() => {
    document.body.innerHTML = '<div id="workspace"></div>';
    const el = document.getElementById("workspace");
    if (!el) throw new Error("workspace element not found");
    workspace = Blockly.inject(el, { trashcan: false, toolbox: undefined });
  });

  afterEach(() => {
    if (workspace) workspace.dispose();
    document.body.innerHTML = "";
  });

  it("works for blocks with a single set of default child blocks", () => {
    const setterBlock: ICustomBlock = {
      id: "custom_setter_color_test",
      name: "color",
      type: "setter",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: false,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["blue", "BLUE"], ["red", "RED"]],
        defaultOptionValue: "RED"
      }
    };

    const creatorBlock: ICustomBlock = {
      id: "custom_creator_molecules_test",
      name: "molecules",
      type: "creator",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: true,
        defaultChildBlocks: {
          "type": "custom_setter_color_test",
          "id": "?L/2u6!bZ5I,{#jfy/o-",
          "extraState": "<mutation xmlns=\"http://www.w3.org/1999/xhtml\" open=\"true\"></mutation>",
          "fields": {
            "value": "BLUE"
          }
        },
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["water", "WATER"]]
      }
    };

    registerCustomBlocks([setterBlock, creatorBlock]);

    cb = workspace?.newBlock("custom_creator_molecules_test") as ICustomBlockWithXml;
    cb?.initSvg();
    cb?.render();

    // Initial state should have default children
    expect(cb?.__cachedChildrenCode).toContain('set_color(agent, "BLUE")');
    expect(cb?.__disclosureOpen).toBe(false);
    expect(cb?.__savedChildrenXml).toBeUndefined();

    // Get the disclosure icon field and trigger its click handler
    const iconField = cb?.getField("__disclosure_icon") as any;
    expect(iconField).toBeDefined();

    // Trigger click to open
    iconField.clickHandler?.();

    // After opening, the block should be open and cached code cleared
    expect(cb?.__disclosureOpen).toBe(true);
    expect(cb?.__cachedChildrenCode).toBe("");
    expect(cb?.__savedChildrenXml).toBe("");

    // Trigger click to close
    iconField.clickHandler?.();

    // After closing, the block should be closed with cached code restored
    expect(cb?.__disclosureOpen).toBe(false);
    expect(cb?.__savedChildrenXml).toContain(`<field name="value">BLUE</field>`);
    expect(cb?.__cachedChildrenCode).toContain('set_color(agent, "BLUE")');
  });

  it("works for blocks with multiple sets of default child blocks", () => {
    const setterBlock: ICustomBlock = {
      id: "custom_setter_color_test",
      name: "color",
      type: "setter",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: false,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["blue", "BLUE"], ["red", "RED"]],
        defaultOptionValue: "RED"
      }
    };

    const creatorBlock: ICustomBlock = {
      id: "custom_creator_molecules_test",
      name: "molecules",
      type: "creator",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: true,
        defaultChildBlocks: {
          "type": "custom_setter_color_test",
          "id": "?L/2u6!bZ5I,{#jfy/o-",
          "extraState": "<mutation xmlns=\"http://www.w3.org/1999/xhtml\" open=\"true\"></mutation>",
          "fields": {
            "value": "BLUE"
          }
        },
        inputsInline: true,
        nextStatement: true,
        optionChildBlocks: {
          water: {
            "type": "custom_setter_color_test",
            "id": "?L/2u6!bZ5I,{#jfy/o-",
            "extraState": "<mutation xmlns=\"http://www.w3.org/1999/xhtml\" open=\"true\"></mutation>",
            "fields": {
              "value": "BLUE"
            }
          },
          fire: {
            "type": "custom_setter_color_test",
            "id": "?L/2u6!bZ5I,{#jfy/o-",
            "extraState": "<mutation xmlns=\"http://www.w3.org/1999/xhtml\" open=\"true\"></mutation>",
            "fields": {
              "value": "RED"
            }
          }
        },
        previousStatement: true,
        typeOptions: [["water", "water"], ["fire", "fire"]],
        useOptionChildBlocks: true
      }
    };

    registerCustomBlocks([setterBlock, creatorBlock]);

    cb = workspace?.newBlock("custom_creator_molecules_test") as ICustomBlockWithXml;
    cb?.initSvg();
    cb?.render();

    // Initial state should have water default children
    expect(cb?.__cachedChildrenCode).toContain('set_color(agent, "BLUE")');
    expect(cb?.__disclosureOpen).toBe(false);
    expect(cb?.__savedChildrenXml).toBeUndefined();

    // Change to fire option, which should swap in fire default children
    cb?.setFieldValue("fire", "type");
    expect(cb?.__cachedChildrenCode).toContain('set_color(agent, "RED")');
    expect(cb?.__disclosureOpen).toBe(false);
    expect(cb?.__savedChildrenXml).toBeUndefined();

    // Get the disclosure icon field and trigger its click handler
    const iconField = cb?.getField("__disclosure_icon") as any;
    expect(iconField).toBeDefined();
    iconField.clickHandler?.();

    // After opening, the block should be open and cached code cleared
    expect(cb?.__disclosureOpen).toBe(true);
    expect(cb?.__cachedChildrenCode).toBe("");
    expect(cb?.__savedChildrenXml).toBe("");

    // Switching to water shouldn't change the open state
    cb?.setFieldValue("water", "type");
    expect(cb?.__disclosureOpen).toBe(true);
    expect(cb?.__cachedChildrenCode).toBe("");
    expect(cb?.__savedChildrenXml).toBe("");

    // Trigger click to close
    iconField.clickHandler?.();

    // After closing, the block should be closed with cached code of the type it had when first opened
    expect(cb?.__disclosureOpen).toBe(false);
    expect(cb?.__savedChildrenXml).toContain(`<field name="value">RED</field>`);
    expect(cb?.__cachedChildrenCode).toContain('set_color(agent, "RED")');
  });

  describe("the disclosure toggle's accessible state", () => {
    const setterBlock: ICustomBlock = {
      id: "custom_setter_color_test",
      name: "color",
      type: "setter",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: false,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["blue", "BLUE"], ["red", "RED"]],
        defaultOptionValue: "RED"
      }
    };

    const creatorBlock: ICustomBlock = {
      id: "custom_creator_molecules_test",
      name: "molecules",
      type: "creator",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: true,
        defaultChildBlocks: {
          "type": "custom_setter_color_test",
          "id": "?L/2u6!bZ5I,{#jfy/o-",
          "fields": {
            "value": "BLUE"
          }
        },
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["water", "WATER"]]
      }
    };

    beforeEach(() => {
      registerCustomBlocks([setterBlock, creatorBlock]);

      cb = workspace?.newBlock("custom_creator_molecules_test") as ICustomBlockWithXml;
      cb?.initSvg();
      cb?.render();
    });

    it("announces the open state when the toggle is clicked open and closed again", () => {
      const iconField = cb?.getField("__disclosure_icon") as any;

      expect(disclosureAria(cb as Blockly.BlockSvg)).toEqual({
        ariaExpanded: "false",
        accessibleName: DISCLOSURE_LABEL_COLLAPSED
      });

      iconField.clickHandler?.();

      expect(disclosureAria(cb as Blockly.BlockSvg)).toEqual({
        ariaExpanded: "true",
        accessibleName: DISCLOSURE_LABEL_EXPANDED
      });

      iconField.clickHandler?.();

      expect(disclosureAria(cb as Blockly.BlockSvg)).toEqual({
        ariaExpanded: "false",
        accessibleName: DISCLOSURE_LABEL_COLLAPSED
      });
    });

    // Excluding the toggle from the block-level label (computeAriaLabel -> "") must not cost the
    // toggle its own name: that is published on a different path (getAriaValue via
    // recomputeAriaContext). In an editable workspace it still announces itself, while the block
    // that owns it no longer recites "image: Hide child blocks" -- a control a report reader
    // cannot operate.
    it("names itself without putting its name on the block that owns it", () => {
      const iconField = cb?.getField("__disclosure_icon") as any;
      const blockLabel = () =>
        (cb as Blockly.BlockSvg).getAriaLabel(Blockly.utils.aria.Verbosity.STANDARD);

      expect(blockLabel()).toContain("molecules");
      expect(blockLabel()).not.toContain(DISCLOSURE_LABEL_COLLAPSED);
      expect(disclosureAria(cb as Blockly.BlockSvg).accessibleName).toBe(DISCLOSURE_LABEL_COLLAPSED);

      iconField.clickHandler?.();

      expect(blockLabel()).not.toContain(DISCLOSURE_LABEL_EXPANDED);
      expect(disclosureAria(cb as Blockly.BlockSvg).accessibleName).toBe(DISCLOSURE_LABEL_EXPANDED);
    });

    // The restore path (saved student work, starter program, report view) runs domToMutation,
    // not the click handler, so it has to reach the same aria state.
    it("survives a serialization round-trip of a block saved in the open state", () => {
      const iconField = cb?.getField("__disclosure_icon") as any;
      iconField.clickHandler?.();
      expect(cb?.__disclosureOpen).toBe(true);

      const state = Blockly.serialization.workspaces.save(workspace as Blockly.WorkspaceSvg);
      Blockly.serialization.workspaces.load(state, workspace as Blockly.WorkspaceSvg);

      const restored =
        workspace?.getBlocksByType("custom_creator_molecules_test", false)[0] as ICustomBlockWithXml;
      expect(restored).toBeDefined();
      expect(restored.__disclosureOpen).toBe(true);
      expect(restored.getInput("statements")).toBeTruthy();

      expect(disclosureAria(restored)).toEqual({
        ariaExpanded: "true",
        accessibleName: DISCLOSURE_LABEL_EXPANDED
      });
    });
  });
});
