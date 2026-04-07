import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const TicketsReports = () => (
  <CategoryReports categories={reportPageCategories.tickets} />
);

export default TicketsReports;
