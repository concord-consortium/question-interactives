import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

const authoredStateSample = {
  version: 1,
  prompt: "Test prompt",
  videoUrl: "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/video/charcoal.mp4",
  captionUrl: "https://models-resources.s3.amazonaws.com/question-interactives/test-captions.vtt",
  poster: "https://models-resources.s3.amazonaws.com/geniblocks/resources/fablevision/rooms/missioncontrol.jpg",
  credit: "Concord.org",
  creditLink: "https://geniventure.concord.org",
  creditLinkDisplayText: "Geniventure",
  required: true
};


context("Test Video Player interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/video-player");
  });

  context("Runtime view", () => {

    it("renders prompt and handles pre-existing interactive state", () => {
        phonePost("initInteractive", {
          mode: "runtime",
          authoredState: authoredStateSample,
          interactiveState: {
            percentageViewed: 0.2,
            lastViewedTimestamp: 1.2
          }
        });


        cy.getIframeBody().find("#app").should("include.text", authoredStateSample.prompt);
        cy.getIframeBody().find("#app").should("include.text", authoredStateSample.credit);
        cy.getIframeBody().find("#app").should("include.text", authoredStateSample.creditLinkDisplayText);
        // cy.getIframeBody().find("#app").find(".vjs-poster").should("have.attr", "style", `background-image: url("${authoredStateSample.poster}");`);
        cy.getIframeBody().find("#app").find(".vjs-text-track-display").should("include.text", "This is a drake");
        cy.getIframeBody().find("video").should("have.attr", "src", authoredStateSample.videoUrl);

      });

    it("plays video", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateSample,
        interactiveState: {
          percentageViewed: 0.2
        }
      });
      phoneListen("interactiveState");
      cy.getIframeBody().find(".vjs-big-play-button").click();
      getAndClearLastPhoneMessage((state) => {
        expect(state.lastViewedTimestamp).greaterThan(1.0);
      });
    });
  });
  context("Authoring view", () => {
  it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: authoredStateSample
      });
      cy.getIframeBody().find("#app").should("include.text", "Video Url");
      cy.getIframeBody().find("#app").should("include.text", "Caption Url");
      cy.getIframeBody().find("#app").should("include.text", "Poster / preview image");
      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Credit");
      cy.getIframeBody().find("#app").should("include.text", "Credit Link");
      cy.getIframeBody().find("#app").should("include.text", "Credit Link Display Text");
      cy.getIframeBody().find("#app").should("include.text", "Fixed Aspect Ratio");
      cy.getIframeBody().find("#app").should("include.text", "Fixed Height");

      cy.getIframeBody().find("#root_videoUrl").should("have.value", authoredStateSample.videoUrl);
      cy.getIframeBody().find("#root_captionUrl").should("include.text", authoredStateSample.captionUrl);
      cy.getIframeBody().find("#root_poster").should("have.value", authoredStateSample.poster);
      cy.getIframeBody().find("#root_prompt").should("include.text", authoredStateSample.prompt);
      cy.getIframeBody().find("#root_credit").should("include.text", authoredStateSample.credit);
      cy.getIframeBody().find("#root_creditLink").should("have.value", authoredStateSample.creditLink);
      cy.getIframeBody().find("#root_creditLinkDisplayText").should("have.value", authoredStateSample.creditLinkDisplayText);

  });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).eql("Test prompt");
      });
    });
  });

  context("Report view", () => {
    it("renders prompt and choices and handles pre-existing interactive state, but doesn't let user change it", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: authoredStateSample,
          interactiveState: {
            percentageViewed: 0.2,
            lastViewedTimestamp: 1.2
          }
      });

      cy.getIframeBody().find("#app").should("include.text", authoredStateSample.prompt);

    });
  });
});
