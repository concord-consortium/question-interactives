import { phonePost, phoneListen, getAndClearLastPhoneMessage } from "../support";

context("Test drag and drop interactive", () => {
  let i = 0;

  beforeEach(() => {
    if (i++ > 0) cy.wait(3000);
    cy.visit("/wrapper.html?iframe=/drag-and-drop");
  });

  context("Runtime view", () => {
    it("renders prompt, sends hint to parent and handles pre-existing interactive state", () => {
      phonePost("initInteractive", {
        mode: "runtime",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          draggingAreaPrompt: "Test dragging area prompt",
          hint: "Hint",
          canvasWidth: 400,
          canvasHeight: 400,
          backgroundImageUrl: "https://placekitten.com/200/200",
          draggableItems: [
            {id: "1", imageUrl: "https://placekitten.com/40/40"},
            {id: "2", imageUrl: "https://placekitten.com/60/60"}
          ]
        },
        interactiveState: {
          itemPositions: {
            "1": {left: 30, top: 30},
            "2": {left: 70, top: 70},
          }
        }
      });
      phoneListen("hint");
      getAndClearLastPhoneMessage((hint) => {
        expect(hint).eql({text: "Hint"});
      });

      cy.getIframeBody().find("#app").should("include.text", "Test prompt");
      cy.getIframeBody().find("#app").should("include.text", "Test dragging area prompt");

      cy.getIframeBody().find("[data-cy='dnd-container']").should("have.attr", "style", "width: 400px; height: 400px; background-image: url(\"https://placekitten.com/200/200\");");

      cy.getIframeBody().find("[data-cy='draggable-item-wrapper']").eq(0).should("have.attr", "style", "left: 30px; top: 30px;");
      cy.getIframeBody().find("[data-cy='draggable-item-wrapper']").eq(1).should("have.attr", "style", "left: 70px; top: 70px;");
    });
  });

  context("Authoring view", () => {
    it("handles pre-existing authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring",
        authoredState: {
          version: 1,
          prompt: "Prompt",
          draggingAreaPrompt: "Test dragging area prompt",
          hint: "Hint",
          canvasWidth: 400,
          canvasHeight: 400,
          backgroundImageUrl: "https://placekitten.com/200/200",
          draggableItems: [
            {id: "1", imageUrl: "https://placekitten.com/40/40"},
            {id: "2", imageUrl: "https://placekitten.com/60/60"}
          ]
        }
      });

      cy.getIframeBody().find("#app").should("include.text", "Prompt");
      cy.getIframeBody().find("#app").should("include.text", "Hint");

      cy.getIframeBody().find("#root_prompt").should("include.text", "Prompt");
      cy.getIframeBody().find("#root_hint").should("include.text", "Hint");
    });

    it("renders authoring form and sends back authored state", () => {
      phonePost("initInteractive", {
        mode: "authoring"
      });
      phoneListen("authoredState");

      cy.getIframeBody().find("#root_prompt").type("Test prompt");
      getAndClearLastPhoneMessage(state => {
        expect(state.version).eql(1);
        expect(state.prompt).include("Test prompt");
      }, 100);

      cy.getIframeBody().find("#root_hint").type("h{backspace}");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).eql("");
      }, 100);

      cy.getIframeBody().find("#root_hint").type("Hint");
      getAndClearLastPhoneMessage(state => {
        expect(state.hint).include("Hint");
      }, 100);
    });
  });

  context("Report view", () => {
    it("handles pre-existing authored state, scales interactive, and does not include prompt", () => {
      phonePost("initInteractive", {
        mode: "report",
        authoredState: {
          version: 1,
          prompt: "Test prompt",
          draggingAreaPrompt: "Test dragging area prompt",
          hint: "",
          canvasWidth: 400,
          canvasHeight: 400,
          backgroundImageUrl: "https://placekitten.com/200/200",
          draggableItems: [
            {id: "1", imageUrl: "https://placekitten.com/40/40"},
            {id: "2", imageUrl: "https://placekitten.com/60/60"}
          ]
        },
        interactiveState: {
          itemPositions: {
            "1": {left: 30, top: 30},
            "2": {left: 70, top: 70},
          }
        }
      });

      cy.getIframeBody().find("#app").should("not.include.text", "Prompt");
      cy.getIframeBody().find("[data-cy='dnd-container']").should("have.attr", "style", "width: 400px; height: 400px; background-image: url(\"https://placekitten.com/200/200\"); transform: scale(0.625); transform-origin: left top;");
      cy.getIframeBody().find("[data-cy='draggable-item-wrapper']").eq(0).should("have.attr", "style", "left: 30px; top: 30px;");
      cy.getIframeBody().find("[data-cy='draggable-item-wrapper']").eq(1).should("have.attr", "style", "left: 70px; top: 70px;");
    });
  });
});
