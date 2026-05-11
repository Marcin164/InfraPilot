import Badge from "../Badge";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

describe("Badge component", () => {
  it("renders text", () => {
    cy.mount(<Badge text="Hello" />);

    cy.contains("Hello").should("exist");
  });

  it("renders icon when provided", () => {
    cy.mount(<Badge text="With icon" icon={faCheck} />);

    cy.get("svg").should("exist");
  });

  it("does not render icon when not provided", () => {
    cy.mount(<Badge text="No icon" />);

    cy.get("svg").should("not.exist");
  });

  it("applies custom className", () => {
    cy.mount(<Badge text="Styled" className="bg-red-500" />);

    cy.get("div").should("have.class", "bg-red-500");
  });

  it("applies inline styles", () => {
    cy.mount(<Badge text="Styled" style={{ backgroundColor: "blue" }} />);

    cy.get("div")
      .should("have.attr", "style")
      .and("include", "background-color: blue");
  });

  it("renders correct text inside span", () => {
    cy.mount(<Badge text="Exact text" />);

    cy.get("span").should("have.text", "Exact text");
  });
});
