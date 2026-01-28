import Blockly from "blockly/core";
import { registerCustomBlocks } from "./block-factory";
import { ICustomBlock } from "../components/types";

interface ICustomBlockWithXml extends Blockly.BlockSvg {
  __cachedChildrenCode: string | undefined;
  __disclosureOpen: boolean;
  __savedChildrenXml: string | undefined;
}

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
});
