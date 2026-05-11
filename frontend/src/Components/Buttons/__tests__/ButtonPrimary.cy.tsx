import ButtonPrimary from "../ButtonPrimary";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

describe("ButtonPrimary component", () => {
  it("renders text", () => {
    cy.mount(<ButtonPrimary text="Click me" />);

    cy.contains("Click me").should("exist");
  });

  it("renders icon when provided", () => {
    cy.mount(<ButtonPrimary icon={faCheck} />);

    cy.get("svg").should("exist");
  });

  it("renders both icon and text", () => {
    cy.mount(<ButtonPrimary icon={faCheck} text="Save" />);

    cy.get("svg").should("exist");
    cy.contains("Save").should("exist");
  });

  it("calls onClick when clicked", () => {
    const onClick = cy.stub().as("onClick");

    cy.mount(<ButtonPrimary text="Click" onClick={onClick} />);

    cy.get("button").click();

    cy.get("@onClick").should("have.been.calledOnce");
  });

  it("does not call onClick when disabled", () => {
    const onClick = cy.stub().as("onClick");

    cy.mount(<ButtonPrimary text="Disabled" onClick={onClick} disabled />);

    cy.get("button").click({ force: true });

    cy.get("@onClick").should("not.have.been.called");
  });

  it("sets disabled attribute correctly", () => {
    cy.mount(<ButtonPrimary text="Disabled" disabled />);

    cy.get("button")
      .should("be.disabled")
      .and("have.attr", "aria-disabled", "true");
  });

  it("applies default type 'button'", () => {
    cy.mount(<ButtonPrimary text="Btn" />);

    cy.get("button").should("have.attr", "type", "button");
  });

  it("accepts custom type", () => {
    cy.mount(<ButtonPrimary text="Submit" type="submit" />);

    cy.get("button").should("have.attr", "type", "submit");
  });

  it("applies custom className", () => {
    cy.mount(<ButtonPrimary text="Styled" className="border border-red-500" />);

    cy.get("button")
      .should("have.class", "border")
      .and("have.class", "border-red-500");
  });

  it("applies blue color styles by default", () => {
    cy.mount(<ButtonPrimary text="Default" />);

    cy.get("button").should("have.class", "bg-[#2B9AE9]");
  });

  it("applies green color styles", () => {
    cy.mount(<ButtonPrimary text="Green" color="green" />);

    cy.get("button").should("have.class", "bg-[#2ECC71]");
  });

  it("applies red color styles", () => {
    cy.mount(<ButtonPrimary text="Red" color="red" />);

    cy.get("button").should("have.class", "bg-[#E74C3C]");
  });

  it("applies yellow color styles", () => {
    cy.mount(<ButtonPrimary text="Yellow" color="yellow" />);

    cy.get("button").should("have.class", "bg-[#F1C40F]");
  });

  it("applies white color styles", () => {
    cy.mount(<ButtonPrimary text="White" color="white" />);

    cy.get("button").should("have.class", "bg-white");
  });

  it("adds spacing class to icon when text exists", () => {
    cy.mount(<ButtonPrimary icon={faCheck} text="With text" />);

    cy.get("svg").should("have.class", "pr-2");
  });

  it("does not add spacing class when only icon is present", () => {
    cy.mount(<ButtonPrimary icon={faCheck} />);

    cy.get("svg").should("not.have.class", "pr-2");
  });
});
