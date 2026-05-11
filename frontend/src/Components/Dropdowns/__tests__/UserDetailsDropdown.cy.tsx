import UserDetailsDropdown from "../UserDetailsDropdown";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as reactRouter from "react-router";
import * as usersService from "../../../Services/users";

describe("UserDetailsDropdown", () => {
  const queryClient = new QueryClient();

  const mountComponent = () => {
    cy.mount(
      <QueryClientProvider client={queryClient}>
        <UserDetailsDropdown data={{ id: "1", name: "John" } as any} />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    cy.stub(reactRouter, "useParams").returns({ id: "1" });
    cy.stub(reactRouter, "useNavigate").returns(cy.stub().as("navigate"));
  });

  it("renders dropdown buttons", () => {
    mountComponent();

    cy.get('[data-cy="edit-user-btn"]').should("exist");
    cy.get('[data-cy="delete-user-btn"]').should("exist");
    cy.get('[data-cy="edit-equipment-btn"]').should("exist");
    cy.get('[data-cy="add-form-btn"]').should("exist");
  });

  it("opens edit user modal", () => {
    mountComponent();

    cy.get('[data-cy="edit-user-btn"]').click();

    cy.get('[data-cy="edit-user-modal"]').should("be.visible");
  });

  it("opens confirmation modal on delete click", () => {
    mountComponent();

    cy.get('[data-cy="delete-user-btn"]').click();

    cy.get('[data-cy="confirmation-modal"]').should("be.visible");
  });

  it("opens add form modal", () => {
    mountComponent();

    cy.get('[data-cy="add-form-btn"]').click();

    cy.get('[data-cy="add-form-modal"]').should("be.visible");
  });

  it("navigates to equipment edit page", () => {
    mountComponent();

    cy.get('[data-cy="edit-equipment-btn"]').click();

    cy.get("@navigate").should(
      "have.been.calledWith",
      "/admin/users/1/equipmentedit",
    );
  });

  it("calls deleteUser on confirm delete", () => {
    const deleteStub = cy.stub(usersService, "deleteUser").resolves({});

    mountComponent();

    cy.get('[data-cy="delete-user-btn"]').click();

    // zakładamy że modal ma przycisk confirm
    cy.get('[data-cy="confirmation-modal"]')
      .find("button")
      .contains(/delete/i)
      .click();

    cy.wrap(deleteStub).should("have.been.called");
  });
});
