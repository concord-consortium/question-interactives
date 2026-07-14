import { phonePost } from "../support/e2e";

// The runtime seeds an empty workspace with these three blocks, none of which may be deleted.
const SEED_BLOCKS = [
  { type: "setup", label: "setup" },
  { type: "go", label: "go" },
  { type: "onclick", label: "on mouse click" }
];

const toolbox = JSON.stringify({
  kind: "flyoutToolbox",
  contents: [
    { kind: "block", type: "controls_if" }
  ]
});

const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  simulationCode: "",
  customBlocks: [],
  // Only `setup` is seeded here, not the whole SEED_BLOCKS set: it is the one drop target the move
  // test needs, and every extra block adds candidate connections to Blockly's constrained-move
  // traversal, which would invalidate the key sequence derived below. The default seeding path —
  // all three seed blocks, non-deletable — is covered in the sibling context.
  starterBlocklyState: JSON.stringify({
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: "setup", id: "seed_setup", x: 10, y: 10, deletable: false },
        { type: "controls_if", id: "loose_if", x: 240, y: 10 }
      ]
    }
  }),
  toolbox
};

// Without an authored starter the runtime falls back to seeding SEED_BLOCKS.
const authoredStateWithoutStarter = {
  version: 1,
  questionType: "iframe_interactive",
  simulationCode: "",
  customBlocks: [],
  toolbox
};

const loadRuntime = (state) => {
  cy.visit("/wrapper.html?iframe=/blockly");
  phonePost("initInteractive", { mode: "runtime", authoredState: state });
};

context("Test blockly interactive", () => {
  context("Runtime view", () => {
    context("with no authored starter program", () => {
      beforeEach(() => {
        loadRuntime(authoredStateWithoutStarter);
      });

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

    // Blockly narrates a block's journey during a move but says nothing when it lands. Without
    // these announcements a student who cannot see the canvas has no way to know a drop worked.
    context("announcements", () => {
      beforeEach(() => {
        loadRuntime(authoredState);
      });

      // Blockly reads KeyboardEvent fields, so a plain Event (Cypress's default) is ignored.
      const pressKey = (key, code, keyCode) => {
        cy.getIframeBody().find(".blocklyActiveFocus").first().trigger("keydown", {
          eventConstructor: "KeyboardEvent",
          key, code, keyCode, which: keyCode,
          bubbles: true, cancelable: true
        });
      };

      // The toolbox flyout renders a controls_if of its own, so the loose one must be picked by id.
      const LOOSE_IF = 'g.controls_if[data-id="loose_if"]';

      const focusLooseIf = () => {
        cy.getIframeBody().find(`${LOOSE_IF} > path.blocklyPath`).click({ force: true });
        cy.getIframeBody().find(`${LOOSE_IF} > path.blocklyPath.blocklyActiveFocus`).should("exist");
      };

      it("announces the parent a block was connected into", () => {
        focusLooseIf();

        pressKey("m", "KeyM", 77); // enter move mode

        // A keyboard move is a constrained move, not a free-form drag: there is no snap radius
        // here. Each arrow steps 20px and Blockly traverses its list of candidate connections,
        // picking a direction from the dominant axis of the accumulated delta. The sequence below
        // was derived empirically against the authored block coordinates, so re-derive it if
        // those coordinates change.
        Cypress._.times(2, () => pressKey("ArrowDown", "ArrowDown", 40));
        Cypress._.times(10, () => pressKey("ArrowLeft", "ArrowLeft", 37));

        pressKey("Enter", "Enter", 13); // commit

        // The block really landed inside setup, so the announcement is not lying about it.
        cy.getIframeBody().find(`g.setup ${LOOSE_IF}`).should("exist");
        // `invoke("text")` rather than asserting on the element: on failure it prints what the live
        // region actually said, which is the only thing worth knowing when this breaks.
        cy.getIframeBody().find("#blocklyAriaAnnounce").invoke("text")
          .should("contain", "connected inside setup");
      });

      // Assert the *named* string, not merely "deleted": the generic "Block deleted." fallback
      // contains that word too, so a looser assertion passes while a student hears nothing about
      // which block went away. That is exactly how a real fallback regression once hid here.
      it("announces a deletion, naming the block that went away", () => {
        focusLooseIf();

        pressKey("Delete", "Delete", 46);

        cy.getIframeBody().find(LOOSE_IF).should("not.exist");
        cy.getIframeBody().find("#blocklyAriaAnnounce").invoke("text")
          .should("contain", "if, do deleted.");
      });
    });
  });
});
