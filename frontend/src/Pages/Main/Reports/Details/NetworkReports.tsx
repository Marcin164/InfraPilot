import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const NetworkReports = () => (
  <CategoryReports categories={reportPageCategories.network} />
);

export default NetworkReports;
