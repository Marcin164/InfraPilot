import Checkbox from "../Checkbox";

describe("Checkbox component", () => {
  it("renders label text", () => {
    cy.mount(<Checkbox label="Accept terms" />);

    cy.contains("Accept terms").should("exist");
  });

  it("toggles checkbox when clicked", () => {
    cy.mount(<Checkbox label="Toggle me" />);

    cy.get('input[type="checkbox"]')
      .click({ force: true })
      .should("be.checked");
  });

  it("calls onChange when clicked", () => {
    const onChange = cy.stub().as("onChange");

    cy.mount(<Checkbox label="onChange test" onChange={onChange} />);

    cy.get('input[type="checkbox"]').click({ force: true });

    cy.get("@onChange").should("have.been.called");
  });

  it("calls handleChange with boolean value", () => {
    const handleChange = cy.stub().as("handleChange");

    cy.mount(
      <Checkbox label="handleChange test" handleChange={handleChange} />,
    );

    cy.get('input[type="checkbox"]').click({ force: true });

    cy.get("@handleChange").should("have.been.calledWith", true);
  });

  it("respects checked prop (controlled)", () => {
    cy.mount(<Checkbox label="checked state" checked={true} />);

    cy.get('input[type="checkbox"]').should("be.checked");
  });

  it("passes name and value attributes", () => {
    cy.mount(<Checkbox label="attributes" name="newsletter" value="yes" />);

    cy.get('input[type="checkbox"]')
      .should("have.attr", "name", "newsletter")
      .should("have.attr", "value", "yes");
  });

  it("applies custom className", () => {
    cy.mount(<Checkbox label="styled" className="bg-red-100 p-2" />);

    cy.get("div")
      .first()
      .should("have.class", "bg-red-100")
      .should("have.class", "p-2");
  });

  it("clicking label toggles checkbox", () => {
    cy.mount(<Checkbox label="Click label" />);

    cy.contains("Click label").click();

    cy.get('input[type="checkbox"]').should("be.checked");
  });
});
