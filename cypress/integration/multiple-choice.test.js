context("Test multiple-choice interactive", () => {
  beforeEach(() => {
    cy.visit("/wrapper.html?iframe=/multiple-choice");
  });

  context("Runtime view", () => {
    it("renders prompt and choices and handles pre-existing interactive state", () => {
      cy.window().should("have.property", "phone");
      cy.window().then(window => {
        window.phone.post("initInteractive", {
          mode: "runtime",
          authoredState: {
            prompt: "Test prompt",
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
      });
      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "choice A");
      cy.getIframeBody().find("#app").should("include.text", "choice B");

      cy.getIframeBody().find("input[value='id1']").should("not.be.checked");
      cy.getIframeBody().find("input[value='id2']").should("be.checked");
    });

    // This is separate from previous test to check dealing with initial, empty state.
    it("sends back interactive state to parent", () => {
      let receivedState = null;

      cy.window().should("have.property", "phone");
      cy.window().then(window => {
        window.phone.post("initInteractive", {
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

        window.phone.addListener("interactiveState", (newState) => {
          receivedState = newState;
        });
      });
      cy.getIframeBody().find("input[value='id1']").click().then(() => {
        expect(receivedState).eql({ selectedChoiceIds: [ "id1" ] });
      });

      cy.getIframeBody().find("input[value='id2']").click().then(() => {
        expect(receivedState).eql({ selectedChoiceIds: [ "id2" ] });
      });
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      cy.window().should("have.property", "phone");
      cy.window().then(window => {
        window.phone.post("initInteractive", {
          mode: "authoring",
          authoredState: {
            version: 1,
            prompt: "Test prompt",
            multipleAnswers: true,
            choices: [
              {id: "id1", content: "Choice A", correct: true},
              {id: "id2", content: "Choice B", correct: false},
            ]
          }
        });
      });
      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Choices");

      cy.getIframeBody().find("#root_prompt").should("have.value", "Test prompt");
      cy.getIframeBody().find("#root_multipleAnswers").should("be.checked");
      cy.getIframeBody().find("#root_choices_0_content").should("have.value", "Choice A");
      cy.getIframeBody().find("#root_choices_0_correct").should("be.checked");
      cy.getIframeBody().find("#root_choices_1_content").should("have.value", "Choice B");
    });

    it("renders authoring form and sends back authored state", () => {
      let receivedState = null;

      cy.window().should("have.property", "phone");
      cy.window().then(window => {
        window.phone.post("initInteractive", {
          mode: "authoring"
        });
        window.phone.addListener("authoredState", (newState) => {
          receivedState = newState;
        });
      });

      cy.getIframeBody().find("#root_prompt").type("Test prompt");
      cy.getIframeBody().find("#root_multipleAnswers").click();
      cy.getIframeBody().find(".btn-add").click();
      cy.getIframeBody().find("#root_choices_0_content").clear();
      cy.getIframeBody().find("#root_choices_0_content").type("Choice A", { force: true });
      cy.getIframeBody().find("#root_choices_0_correct").click();
      cy.getIframeBody().find(".btn-add").click();
      cy.getIframeBody().find("#root_choices_1_content").clear();
      cy.getIframeBody().find("#root_choices_1_content").type("Choice B", { force: true }).then(() => {
        expect(receivedState.version).eql(1);
        expect(receivedState.prompt).eql("Test prompt");
        expect(receivedState.multipleAnswers).eql(true);
        expect(receivedState.choices[0].content).eql("Choice A");
        expect(receivedState.choices[0].correct).eql(true);
        expect(receivedState.choices[1].content).eql("Choice B");
        expect(receivedState.choices[1].correct).eql(false);
      });
    });
  });
});
