import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

const authoredStateSample = {
  version: 1,
  url: "http://authoring.staging.concord.org/assets/cc-logo-2a224e4f218b2f9c9c0d094362fe7372.png",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  allowLightbox: true,
  fullWidth: true
};

context("Test Video Player interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/image");
  });

  context("Runtime view", () => {
    it("renders image on first load", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateSample
      });

      const app = cy.getIframeBody().find("#app");
      app.should("include.text", authoredStateSample.caption);
      app.should("include.text", authoredStateSample.credit);
      app.should("include.text", authoredStateSample.creditLinkDisplayText);
      cy.getIframeBody().find("img").should("have.attr", "src", authoredStateSample.url);
    });
  });
});
