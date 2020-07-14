import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test open response interactive", () => {
  let i = 0;

  beforeEach(() => {
    if (i++ > 0) cy.wait(3000);
    cy.visit("/wrapper.html?iframe=/open-response");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        },
        interactiveState: {
          answerType: "open_response_answer",
          answerText: "Test response"
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage((hint) => {
        expect(hint).eql({ text: "Hint" });
      });

      cy.getIframeBody().find("#app fieldset legend").should("include.text", "Test prompt");

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Default answer");
      cy.getIframeBody().find("textarea").should("have.value", "Test response");
    });

    // This is separate from previous test to check dealing with initial, empty state.
    it("sends back interactive state to parent", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        }
      });
      phoneListen("interactiveState");

      cy.getIframeBody().find("textarea").type("test answer");
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ answerType: "open_response_answer", answerText: "test answer" });
      });
    });
  });

  context("Submit button", () => {

    it("renders a Submit button and shows feedback when Submit is clicked", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer",
          required: true,
          predictionFeedback: "Good guess"
        }
      });

      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("be.visible");
      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("include.text", "Submit");
      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("have.attr", "disabled");

      cy.getIframeBody().find("textarea").type("test answer");

      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("not.have.attr", "disabled");

      cy.getIframeBody().find("[data-cy=lock-answer-button]").click();

      cy.getIframeBody().find("textarea").should("have.attr", "disabled");
      cy.getIframeBody().find("[data-cy=locked-info]").should("be.visible");
      cy.getIframeBody().find("[data-cy=locked-info]").should("include.text", "locked");
      cy.getIframeBody().find("[data-cy=locked-info]").should("include.text", "Good guess");
    });

  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");
      cy.getIframeBody().find("#app").should("include.text", "Default answer");

      cy.getIframeBody().find("#root_prompt").should("include.text", "Test prompt");
      cy.getIframeBody().find("#root_hint").should("include.text", "Hint");
      cy.getIframeBody().find("#root_defaultAnswer").should("have.value", "Default answer");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt").tab();
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).include("Test prompt");
      }, 100);

      cy.getIframeBody().find("#root_hint").type("Hint").tab();
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).include("Hint");
      }, 100);

      cy.getIframeBody().find("#root_defaultAnswer").type("Default answer");
      getAndClearLastPhoneMessage(state => {
        expect(state.defaultAnswer).eql("Default answer");
      });
    });
  });

  context("Report view", () => {
    it("renders prompt and response and handles pre-existing interactive state, but doesn't let user change it", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          hint: "Hint",
          defaultAnswer: "Default answer"
        },
        interactiveState: {
          answerText: "Test response"
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Default answer");
      cy.getIframeBody().find("textarea").should("have.value", "Test response");

      cy.getIframeBody().find("textarea").type("New answer", { force: true });

      cy.getIframeBody().find("textarea").should("have.value", "Test response");
    });
  });
});
