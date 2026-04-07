import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const SecurityReports = () => (
  <CategoryReports categories={reportPageCategories.security} />
);

export default SecurityReports;
