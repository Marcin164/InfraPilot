import { useState } from "react";
import { PermissionCheckboxGrid } from "../CustomRoles";
import type { PermissionCatalog } from "../../../../../Services/customRoles";

const catalog: PermissionCatalog = {
  groups: [
    {
      key: "devices",
      label: "Devices",
      permissions: [
        { code: "devices.view", label: "View devices" },
        { code: "devices.map.view", label: "View map" },
      ],
    },
    {
      key: "licenses",
      label: "Licenses",
      permissions: [{ code: "licenses.view", label: "View licenses" }],
    },
  ],
  implies: {
    "devices.view": ["devices.map.view"],
  },
};

// Mirrors exactly how CustomRoleModal drives the grid: local state + onToggle.
const Harness = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const onToggle = (code: string) =>
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  return (
    <PermissionCheckboxGrid
      catalog={catalog}
      selected={selected}
      disabled={false}
      onToggle={onToggle}
    />
  );
};

describe("PermissionCheckboxGrid", () => {
  it("checks a permission when its checkbox is clicked", () => {
    cy.mount(<Harness />);

    cy.contains("View licenses")
      .parents("label")
      .find('input[type="checkbox"]')
      .should("not.be.checked")
      .click({ force: true });

    cy.contains("View licenses")
      .parents("label")
      .find('input[type="checkbox"]')
      .should("be.checked");
  });

  it("unchecks a permission on a second click", () => {
    cy.mount(<Harness />);

    cy.contains("View licenses").click();
    cy.contains("View licenses")
      .parents("label")
      .find('input[type="checkbox"]')
      .should("be.checked");

    cy.contains("View licenses").click();
    cy.contains("View licenses")
      .parents("label")
      .find('input[type="checkbox"]')
      .should("not.be.checked");
  });

  it("checking a permission that implies another auto-checks and disables the implied one", () => {
    cy.mount(<Harness />);

    cy.contains("View devices").click();

    cy.contains("View map")
      .parents("label")
      .find('input[type="checkbox"]')
      .should("be.checked")
      .should("be.disabled");
  });
});
