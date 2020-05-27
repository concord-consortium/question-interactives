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
        expect(hint).eql("Hint");
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
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
        expect(state).eql({ selectedChoiceIds: [ "id1" ] });
      });

      cy.getIframeBody().find("input[value='id2']").click();
      getAndClearLastPhoneMessage((state) => {
        expect(state).eql({ selectedChoiceIds: [ "id2" ] });
      });
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

      cy.getIframeBody().find("#root_prompt").should("have.value", "Test prompt");
      cy.getIframeBody().find("#root_hint").should("have.value", "Hint");
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

      cy.getIframeBody().find("#root_prompt").type("Test prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).eql("Test prompt");
      });

      cy.getIframeBody().find("#root_hint").type("Hint");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).eql("Hint");
      });

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
