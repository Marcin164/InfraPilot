import Search from "../Search";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";

const i18nMock = i18n.createInstance();

i18nMock.init({
  lng: "en",
  resources: {
    en: {
      translation: {
        search: "Search...",
      },
    },
  },
});

const mountWithI18n = (component: React.ReactNode) => {
  cy.mount(<I18nextProvider i18n={i18nMock}>{component}</I18nextProvider>);
};

describe("Search component", () => {
  it("renders input", () => {
    mountWithI18n(<Search onChange={() => {}} />);

    cy.get("input").should("exist");
  });

  it("displays translated placeholder", () => {
    mountWithI18n(<Search onChange={() => {}} />);

    cy.get("input").should("have.attr", "placeholder", "Search...");
  });

  it("calls onChange when typing", () => {
    const onChange = cy.stub().as("onChange");

    mountWithI18n(<Search onChange={onChange} />);

    cy.get("input").type("hello");

    cy.get("@onChange").should("have.been.called");
  });

  it("accepts custom className", () => {
    mountWithI18n(
      <Search onChange={() => {}} className="border border-red-500" />,
    );

    cy.get("input")
      .should("have.class", "border")
      .should("have.class", "border-red-500");
  });

  it("allows typing text", () => {
    mountWithI18n(<Search onChange={() => {}} />);

    cy.get("input").type("Infrapilot").should("have.value", "Infrapilot");
  });
});
