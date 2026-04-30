import Badge from "../Badge";

describe("Checkbox component", () => {
  it("renders label text", () => {
    cy.mount(<Badge text="Text" icon="fa" />);

    cy.contains("Accept terms").should("exist");
  });
});
