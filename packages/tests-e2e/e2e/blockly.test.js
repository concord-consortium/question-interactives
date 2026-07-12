import { phonePost } from "../support/e2e";

// The runtime seeds an empty workspace with these three blocks, none of which may be deleted.
const SEED_BLOCKS = [
  { type: "setup", label: "setup" },
  { type: "go", label: "go" },
  { type: "onclick", label: "on mouse click" }
];

const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  simulationCode: "",
  customBlocks: [],
  toolbox: JSON.stringify({
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "controls_if" }
    ]
  })
};

context("Test blockly interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/blockly");
    phonePost("initInteractive", { mode: "runtime", authoredState });
  });

  context("Runtime view", () => {
    it("renders the workspace with the seed blocks", () => {
      cy.getIframeBody().find(".injectionDiv").should("exist");
      SEED_BLOCKS.forEach(({ type }) => {
        cy.getIframeBody().find(`g.${type}.blocklyNotDeletable`).should("exist");
      });
    });

    // Blockly announces through a single live region created during inject(), and names each
    // block on the path that renders it. Screen reader users have neither without these.
    it("exposes the workspace and blocks to screen readers", () => {
      cy.getIframeBody().find("#blocklyAriaAnnounce")
        .should("have.attr", "role", "status")
        .and("have.attr", "aria-live", "polite");

      SEED_BLOCKS.forEach(({ type, label }) => {
        cy.getIframeBody().find(`g.${type} > path.blocklyPath`)
          .should("have.attr", "role", "figure")
          .and("have.attr", "aria-label")
          .and("contain", label);
      });
    });

    // Blockly deliberately keeps blocks out of the tab order — block code cannot be usefully
    // linearized — so the workspace is the tab stop and arrow keys move a cursor into it.
    it("lets a keyboard user reach a block", () => {
      cy.getIframeBody().find("g.blocklyWorkspace").should("have.attr", "tabindex", "0");

      cy.getIframeBody().find(".blocklyMainBackground").click({ force: true });
      cy.getIframeBody().find("g.blocklyWorkspace.blocklyActiveFocus").should("exist");

      // Blockly reads KeyboardEvent fields, so a plain Event (Cypress's default) is ignored.
      cy.getIframeBody().find("g.blocklyWorkspace.blocklyActiveFocus")
        .trigger("keydown", {
          eventConstructor: "KeyboardEvent",
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true
        });

      // Focus lands on a block, and it carries the name a screen reader would read out.
      cy.getIframeBody().find("path.blocklyPath.blocklyActiveFocus")
        .should("exist")
        .and("have.attr", "aria-label");
    });
  });
});
