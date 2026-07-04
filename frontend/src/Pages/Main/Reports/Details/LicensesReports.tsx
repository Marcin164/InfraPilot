import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const LicensesReports = () => (
  <CategoryReports categories={reportPageCategories.licenses} />
);

export default LicensesReports;
