context("Test multiple-choice", () => {
  beforeEach(() => {
    cy.visit("/multiple-choice");
  });

  it("renders with text", () => {
    cy.get("#app").should("have.text", "Loading...");
  });
});
