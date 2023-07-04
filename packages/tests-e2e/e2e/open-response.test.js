import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support/e2e";

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

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Please type your answer here.");
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
      cy.getIframeBody().find("textarea").should("have.value", "Default answer");
      cy.getIframeBody().find("textarea").type(". Test answer");
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ answerType: "open_response_answer", answerText: "Default answer. Test answer" });
      });
    });

    it("allows the recording of an audio response if audioEnabled is true", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          defaultAnswer: "Default answer",
          audioEnabled: true
        },
        interactiveState: {
          answerType: "open_response_answer",
          answerText: ""
        }
      });

      cy.getIframeBody().find("[data-testid=audio-record-button]").should("be.visible");
      cy.getIframeBody().find("[data-testid=timer-readout]").should("be.visible");
      cy.getIframeBody().find("[data-testid=timer-readout]").should("include.text", "00:00");
      cy.getIframeBody().find("[data-testid=audio-record-button]").click();
      cy.wait(1000);
      cy.getIframeBody().find("[data-testid=timer-readout]").should("include.text", "00:01");
      cy.getIframeBody().find("[data-testid=audio-record-button]").click();
      cy.getIframeBody().find("[data-testid=timer-readout]").should("include.text", "00:00");
      cy.getIframeBody().find("[data-testid=saving-indicator]").should("be.visible");
      cy.getIframeBody().find("[data-testid=saving-indicator]").should("include.text", "Saving ...");
    });

    it("automatically increases height of textarea if audioEnabled is true", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          defaultAnswer: "Default answer",
          audioEnabled: true
        },
        interactiveState: {
          answerType: "open_response_answer",
          answerText: ""
        }
      });

      cy.getIframeBody().find("textarea").invoke("height").should("not.be.lessThan", 123);
      cy.getIframeBody().find("textarea").type(
        "Hydrogen atoms shores of the cosmic ocean tesseract citizens of distant epochs rings of Uranus Euclid? Star stuff harvesting star light descended from astronomers another world Champollion two ghostly white figures in coveralls and helmets are softly dancing cosmos. Encyclopaedia galactica vanquish the impossible inconspicuous motes of rock and gas preserve and cherish that pale blue dot a very small stage in a vast cosmic arena Sea of Tranquility and billions upon billions upon billions upon billions upon billions upon billions upon billions. Hydrogen atoms shores of the cosmic ocean tesseract citizens of distant epochs rings of Uranus Euclid? Star stuff harvesting star light descended from astronomers another world Champollion two ghostly white figures in coveralls and helmets are softly dancing cosmos.",
        { delay: 0 }
      );
      cy.getIframeBody().find("textarea").invoke("height").should("be.greaterThan", 122);
      cy.getIframeBody().find("textarea").type("{backspace}".repeat(300), { delay: 0 });
      cy.getIframeBody().find("textarea").invoke("height").should("not.be.lessThan", 123);
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
          defaultAnswer: "",
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

      cy.getIframeBody().find("#root_prompt").type(" Test prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).include("Test prompt");
      }, 100);

      cy.getIframeBody().find("#root_hint").type(" h{backspace}");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).eql("");
      }, 100);

      cy.getIframeBody().find("#root_hint").type(" Hint");
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

      cy.getIframeBody().find("textarea").should("have.attr", "placeholder", "Please type your answer here.");
      cy.getIframeBody().find("textarea").should("have.value", "Test response");

      cy.getIframeBody().find("textarea").type("New answer", { force: true });

      cy.getIframeBody().find("textarea").should("have.value", "Test response");
    });
  });
});
