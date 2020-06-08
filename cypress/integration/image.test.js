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
  layout: "fitWidth"
};

context("Test Video Player interactive", () => {
  beforeEach(() => {
    // cy.viewport(800, 600);
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

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: authoredStateSample
      });

      const app = cy.getIframeBody().find("#app");
      app.should("include.text", "Url");
      app.should("include.text", "Url (high resolution image)");
      app.should("include.text", "Alt Text");
      app.should("include.text", "Caption");
      app.should("include.text", "Credit");
      app.should("include.text", "Credit Link");
      app.should("include.text", "Credit Link Display Text");
      app.should("include.text", "Allow lightbox");
      app.should("include.text", "Choose a layout style for the image");

      cy.getIframeBody().find("#root_url").should("have.value", authoredStateSample.url);
      cy.getIframeBody().find("#root_highResUrl").should("have.value", authoredStateSample.highResUrl);
      cy.getIframeBody().find("#root_altText").should("have.value", authoredStateSample.altText);
      cy.getIframeBody().find("#root_caption").should("include.text", authoredStateSample.caption);
      cy.getIframeBody().find("#root_credit").should("include.text", authoredStateSample.credit);
      cy.getIframeBody().find("#root_creditLink").should("have.value", authoredStateSample.creditLink);
      cy.getIframeBody().find("#root_creditLinkDisplayText").should("have.value", authoredStateSample.creditLinkDisplayText);
      cy.getIframeBody().find("#root_allowLightbox").should("be.checked");

    });
  });
});
