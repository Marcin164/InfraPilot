import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const KnowledgeReports = () => (
  <CategoryReports categories={reportPageCategories.knowledge} />
);

export default KnowledgeReports;
