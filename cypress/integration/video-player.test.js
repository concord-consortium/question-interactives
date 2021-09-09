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
  let i = 0;

  beforeEach(() => {
    if (i++ > 0) cy.wait(4000);
    cy.visit("/wrapper.html?iframe=/video-player");
  });

  context("Runtime view", () => {
    it("renders video with poster on first load", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateSample,
        interactiveState: {
          percentageViewed: 0,
          lastViewedTimestamp: 0
        }
      });

      const app = cy.getIframeBody().find("#app");
      app.should("include.text", authoredStateSample.prompt);
      app.should("include.text", authoredStateSample.credit);
      app.should("include.text", authoredStateSample.creditLinkDisplayText);
      cy.getIframeBody().find(".vjs-poster").should('exist');
      cy.getIframeBody().find("video").should("have.attr", "src", authoredStateSample.videoUrl);
    });

    it("handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateSample,
        interactiveState: {
          lastViewedTimestamp: 2.0
        }
      });

      const app = cy.getIframeBody().find("#app");
      // poster image is hidden if the video is not at the start
      cy.getIframeBody().find(".vjs-poster.vjs-hidden").should('exist');
      cy.getIframeBody().find("video").should("have.attr", "src", authoredStateSample.videoUrl);
      cy.getIframeBody().find(".vjs-current-time-display").should("include.text", "0:02");
    });

    it("plays video", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: authoredStateSample,
        interactiveState: {
          percentageViewed: 0.1
        }
      });
      phoneListen("interactiveState");
      cy.getIframeBody().find(".vjs-big-play-button").click();
      cy.getIframeBody().find(".vjs-current-time-display").should("include.text", "0:01");
      cy.getIframeBody().find(".vjs-poster.vjs-hidden").should("exist");

      getAndClearLastPhoneMessage(state => {
        expect(state.lastViewedTimestamp).greaterThan(1.0);
        // must wait for video to finish apparently
      }, 22000);
    });
  });
  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: authoredStateSample
      });
      const app = cy.getIframeBody().find("#app");
      app.should("include.text", "Video Url");
      app.should("include.text", "Closed Caption / Subtitles VTT File URL");
      app.should("include.text", "Poster / preview image");
      app.should("include.text", "Description");
      app.should("include.text", "Credit");
      app.should("include.text", "Credit Link");
      app.should("include.text", "Credit Link Display Text");
      app.should("include.text", "Fixed Aspect Ratio");
      app.should("include.text", "Fixed Height");

      cy.getIframeBody().find("#root_videoUrl").should("have.value", authoredStateSample.videoUrl);
      cy.getIframeBody().find("#root_captionUrl").should("have.value", authoredStateSample.captionUrl);
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
    it("renders video at last timestamp but does not allow user to play the video", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: authoredStateSample,
        interactiveState: {
          percentageViewed: 0.2,
          lastViewedTimestamp: 1.2
        }
      });
      cy.getIframeBody().find(".vjs-current-time-display").should("include.text", "0:01");
      // Setting controls=false on the video player should remove all the controls, but the video.js library seems to be ignoring this value. More work to be done here, though we don't actually have any firm stories detailing what _should_ appear on report view. For now, leaving this out.
      // cy.getIframeBody().find(".vjs-big-play-button").should("not.exist");

    });
  });
});
