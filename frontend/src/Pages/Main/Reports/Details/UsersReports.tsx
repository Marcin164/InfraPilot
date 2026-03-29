import React, { useState } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import AdminAccountsReport from "../components/AdminAccountsReport";
import NewUsersReport from "../components/NewUsersReport";
import UsersWithoutDevicesReport from "../components/UsersWithoutDevicesReport";
import PageContainer from "../components/PageContainer";
import SectionTitle from "../components/SectionTitle";
import UsersPerDepartmentReport from "../components/UsersPerDepartmentReport";
import InactiveUsersReport from "../components/InactiveUsersReport";
import AccountStatusReport from "../components/AccountStatusReport";

type Props = {};

const UsersReports = (props: Props) => {
  return (
    <PageContainer>
      <AdminAccountsReport />
      <UsersWithoutDevicesReport />
      <AccountStatusReport />
      <UsersPerDepartmentReport />
      <NewUsersReport />
      <InactiveUsersReport />
    </PageContainer>
  );
};

export default UsersReports;
