import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

const authoredStateSample = {
  version: 1,
  // url here is a small image 114px x 35px
  url: "http://authoring.staging.concord.org/assets/cc-logo-2a224e4f218b2f9c9c0d094362fe7372.png",
  highResUrl: "http://concord.org/sites/default/files/images/logos/cc/cc-logo.png",
  altText: "CC Logo",
  caption: "Image showing the CC Logo",
  credit: "Copyright Concord Consortium",
  creditLink: "https://concord.org",
  creditLinkDisplayText: "Concord.org",
  allowLightbox: true,
  scaling: "fitWidth"
};

context("Test Image interactive", () => {
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
      cy.getIframeBody().find("img").should('have.css', 'max-width');
      // authored state set to fitWidth, page width is larger than 400, so image should be larger than native 115px
      cy.getIframeBody().find("img").invoke('outerWidth').should('be.gt', 400);
    });

    it("resizes image within page viewport with layout set to fitWidth", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateSample
      });
      cy.viewport(400, 600);
      cy.getIframeBody().find(".runtime--imageContainer--question-int").invoke('outerWidth').should('be.lt', 400);
      cy.getIframeBody().find("img").invoke('outerWidth').should('be.lt', 400);
    });

    it("renders a small image at original size when layout set to originalDimensions", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: { ...authoredStateSample, scaling: "originalDimensions" }
      });
      cy.getIframeBody().find("img").invoke('outerWidth').should('be.lt', 400);
    });
  });


  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {

      // fake token-service JWT so that image upload control is displayed above url
      phoneListen("getFirebaseJWT", (data, phone) => {
        phone.post("firebaseJWT", {
          requestId: 1,
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        });
      });

      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: authoredStateSample,
        hostFeatures: {
          getFirebaseJwt: {version: "1.0.0"}
        }
      });

      const app = cy.getIframeBody().find("#app");
      app.should("include.text", "URL");
      app.should("include.text", "URL (high-resolution image)");
      app.should("include.text", "Alt Text");
      app.should("include.text", "Caption");
      app.should("include.text", "Credit");
      app.should("include.text", "Credit Link");
      app.should("include.text", "Credit Link Display Text");
      app.should("include.text", "Allow lightbox");
      app.should("include.text", "Choose a scaling style for the image");
      app.should("include.text", "Drop an image here, or click to select a file to upload. Only popular image formats are supported (e.g. png, jpeg, gif, svg, webp).");

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
