import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test multiple-choice interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/multiple-choice");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          hint: "Hint",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ]
        },
        interactiveState: {
          selectedChoiceIds: [ "id2" ]
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage((hint) => {
        expect(hint).eql({ text: "Hint" });
      });

      cy.getIframeBody().find("#app fieldset legend").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "choice A");
      cy.getIframeBody().find("#app").should("include.text", "choice B");

      cy.getIframeBody().find("input[value='id1']").should("not.be.checked");
      cy.getIframeBody().find("input[value='id2']").should("be.checked");
    });

    // This is separate from previous test to check dealing with initial, empty state.
    it("sends back interactive state to parent", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ]
        }
      });
      phoneListen("interactiveState");

      cy.getIframeBody().find("input[value='id1']").click();
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ answerType: "multiple_choice_answer", selectedChoiceIds: [ "id1" ], answerText: "choice A" });
      });

      cy.getIframeBody().find("input[value='id2']").click();
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ answerType: "multiple_choice_answer", selectedChoiceIds: [ "id2" ], answerText: "choice B" });
      });
    });
  });

  context("Check answer button", () => {

    it("renders a check answer button", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          enableCheckAnswer: true
        }
      });

      cy.getIframeBody().find("[data-cy=check-answer-button]").should("be.visible");
      cy.getIframeBody().find("[data-cy=check-answer-button]").should("include.text", "Check answer");
      cy.getIframeBody().find("[data-cy=check-answer-button]").should("have.attr", "disabled");
    });

    it("shows correct answer when check answer is clicked", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B", correct: true},
          ],
          enableCheckAnswer: true
        }
      });

      cy.getIframeBody().find("input[value='id1']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").should("not.have.attr", "disabled");

      cy.getIframeBody().find("[data-cy=check-answer-button]").click();

      cy.getIframeBody().find("[data-cy=feedback-false]").should("be.visible");

      cy.getIframeBody().find("input[value='id2']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();

      cy.getIframeBody().find("[data-cy=feedback-true]").should("be.visible");
    });

    it("shows custom choice feedback if authored", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A", choiceFeedback: "Custom"},
            {id: "id2", content: "choice B", correct: true},
          ],
          enableCheckAnswer: true,
          customFeedback: true
        }
      });

      cy.getIframeBody().find("input[value='id1']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();
      cy.getIframeBody().find("[data-cy=feedback-false]").should("include.text", "Custom");

      cy.getIframeBody().find("input[value='id2']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();
      cy.getIframeBody().find("[data-cy=feedback-true]").should("include.text", "correct");
    });

    it("shows appropriate choice feedback for multiple answers", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: true,
          choices: [
            {id: "id1", content: "choice A", correct: true},
            {id: "id2", content: "choice B", correct: true},
            {id: "id3", content: "choice C"},
            {id: "id4", content: "choice D", choiceFeedback: "Custom"},
          ],
          enableCheckAnswer: true,
          customFeedback: true
        }
      });

      cy.getIframeBody().find("input[value='id1']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();
      cy.getIframeBody().find("[data-cy=feedback-false]").should("include.text", "right track");

      cy.getIframeBody().find("input[value='id2']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();
      cy.getIframeBody().find("[data-cy=feedback-true]").should("include.text", "correct");

      cy.getIframeBody().find("input[value='id3']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();
      cy.getIframeBody().find("[data-cy=feedback-false]").should("include.text", "incorrect");

      cy.getIframeBody().find("input[value='id3']").click();
      cy.getIframeBody().find("input[value='id4']").click();
      cy.getIframeBody().find("[data-cy=check-answer-button]").click();
      cy.getIframeBody().find("[data-cy=feedback-false]").should("include.text", "Custom");
    });

  });

  context("Submit button", () => {

    it("renders a submit button if required: true", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          required: true,
        }
      });

      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("be.visible");
      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("include.text", "Submit");
      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("have.attr", "disabled");
    });

    it("locks the answer when Submit is clicked", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          required: true,
        }
      });

      cy.getIframeBody().find("input[value='id1']").click();
      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("not.have.attr", "disabled");
      cy.getIframeBody().find("[data-cy=lock-answer-button]").click();
      cy.getIframeBody().find("input[value='id1']").should("have.attr", "disabled");
      cy.getIframeBody().find("[data-cy=locked-info]").should("be.visible");
      cy.getIframeBody().find("[data-cy=locked-info]").should("include.text", "locked");
    });

    it("shows feedback when Submit is clicked", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          required: true,
          predictionFeedback: "Good guess"
        }
      });

      cy.getIframeBody().find("input[value='id1']").click();
      cy.getIframeBody().find("[data-cy=lock-answer-button]").click();
      cy.getIframeBody().find("[data-cy=locked-info]").should("include.text", "Good guess");
    });

    it("enables the Submit button correctly for dropdown questions", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          layout: "dropdown",
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          required: true,
        }
      });

      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("have.attr", "disabled");

      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          layout: "dropdown",
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          required: true,
        },
        interactiveState: {
          selectedChoiceIds: [ "id2" ]
        }
      });

      cy.getIframeBody().find("[data-cy=lock-answer-button]").should("not.have.attr", "disabled");
    });

  });

  context("Dropdown layout", () => {
    it("renders prompt, dropdown, and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          hint: "Hint",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          layout: "dropdown"
        },
        interactiveState: {
          selectedChoiceIds: [ "id2" ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app option").should("include.text", "choice A");
      cy.getIframeBody().find("#app option").should("include.text", "choice B");

      cy.getIframeBody().find("select").should("have.value", "id2");
    });
  });

  context("Horizontal and Likert layouts", () => {
    it("renders prompt with correct horizontal style", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          hint: "Hint",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          layout: "horizontal"
        },
        interactiveState: {
          selectedChoiceIds: [ "id2" ]
        }
      });

      cy.getIframeBody().find("[data-cy=choices-container]").should("have.css", "display", "flex");
    });

    it("renders prompt with correct likert style", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          prompt: "Test prompt",
          hint: "Hint",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ],
          layout: "likert"
        },
        interactiveState: {
          selectedChoiceIds: [ "id2" ]
        }
      });

      cy.getIframeBody().find("[data-cy=choices-container]").should("have.css", "display", "grid");
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
          multipleAnswers: true,
          choices: [
            {id: "id1", content: "Choice A", correct: true},
            {id: "id2", content: "Choice B", correct: false},
          ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");
      cy.getIframeBody().find("#app").should("include.text", "Choices");

      cy.getIframeBody().find("#root_prompt").should("include.text", "Test prompt");
      cy.getIframeBody().find("#root_hint").should("include.text", "Hint");
      cy.getIframeBody().find("#root_multipleAnswers").should("be.checked");
      cy.getIframeBody().find("#root_choices_0_content").should("have.value", "Choice A");
      cy.getIframeBody().find("#root_choices_0_correct").should("be.checked");
      cy.getIframeBody().find("#root_choices_1_content").should("have.value", "Choice B");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      // cy.getIframeBody().find("#root_prompt").type("Test prompt");
      // getAndClearLastPhoneMessage(state => {
      //   expect(state.version).eql(1);
      //   expect(state.prompt).eql("Test prompt");
      // });

      // cy.getIframeBody().find("#root_hint").type("Hint");
      // getAndClearLastPhoneMessage(state => {
      //   expect(state.hint).eql("Hint");
      // });

      cy.getIframeBody().find("#root_multipleAnswers").click();
      getAndClearLastPhoneMessage(state => {
        expect(state.multipleAnswers).eql(true);
      });

      cy.getIframeBody().find(".btn-add").click();
      cy.getIframeBody().find("#root_choices_0_content").clear();
      cy.getIframeBody().find("#root_choices_0_content").type("Choice A", { force: true });
      cy.getIframeBody().find("#root_choices_0_correct").click();
      getAndClearLastPhoneMessage(state => {
        expect(state.choices[0].content).eql("Choice A");
        expect(state.choices[0].correct).eql(true);
      });

      cy.getIframeBody().find(".btn-add").click();
      cy.getIframeBody().find("#root_choices_1_content").clear();
      cy.getIframeBody().find("#root_choices_1_content").type("Choice B", { force: true });
      getAndClearLastPhoneMessage(state => {
        expect(state.choices[1].content).eql("Choice B");
        expect(state.choices[1].correct).eql(false);
      });
    });
  });

  context("Report view", () => {
    it("renders prompt and choices and handles pre-existing interactive state, but doesn't let user change it", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: {
          prompt: "Test prompt",
          multipleAnswers: false,
          choices: [
            {id: "id1", content: "choice A"},
            {id: "id2", content: "choice B"},
          ]
        },
        interactiveState: {
          selectedChoiceIds: ["id2"]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "choice A");
      cy.getIframeBody().find("#app").should("include.text", "choice B");

      cy.getIframeBody().find("input[value='id1']").should("not.be.checked");
      cy.getIframeBody().find("input[value='id2']").should("be.checked");

      cy.getIframeBody().find("input[value='id2']").click({ force: true });

      cy.getIframeBody().find("input[value='id1']").should("not.be.checked");
      cy.getIframeBody().find("input[value='id2']").should("be.checked");
    });
  });
});
