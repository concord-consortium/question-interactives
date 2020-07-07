import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

const authoredStateWithoutStamps = {
  version: 1,
  questionType: "open_response",
  imageFit: "shrinkBackgroundToCanvas",
  imagePosition: "center",
  stampCollections: []
};

const authoredStateWithStamps = {
  version: 1,
  questionType: "open_response",
  imageFit: "shrinkBackgroundToCanvas",
  imagePosition: "center",
  stampCollections: [{
    collection: "custom",
    name: "My stamps",
    stamps: [
      "https://interactions-resources.concord.org/stamps/simple-atom.svg"
    ]
  }]
};

context("Test Image interactive", () => {
  beforeEach(() => {
    // cy.viewport(800, 600);
    cy.visit("/wrapper.html?iframe=/drawing-tool");
  });

  context("Runtime view", () => {
    it("renders drawing tool without stamps", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateWithoutStamps
      });

      cy.getIframeBody().find(".dt-container").should('exist');
      cy.getIframeBody().find('[title="Stamp tool (click and hold to show available categories)"]').should('not.exist');
    });

    it("renders drawing tool with stamps", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateWithStamps
      });

      cy.getIframeBody().find('[title="Stamp tool (click and hold to show available categories)"]').should('exist');
    });
  });
});
