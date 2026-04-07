import React from "react";
import CategoryReports from "../components/CategoryReports";
import { reportPageCategories } from "../../../../Constants/navigation";

const UsersReports = () => (
  <CategoryReports categories={reportPageCategories.users} />
);

export default UsersReports;
