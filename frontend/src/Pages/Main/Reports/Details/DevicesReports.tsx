import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const DevicesReports = () => (
  <CategoryReports categories={reportPageCategories.devices} />
);

export default DevicesReports;
