import React, { useState } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import AdminAccountsReport from "../../../../Components/Reports/AdminAccountsReport";
import NewUsersReport from "../../../../Components/Reports/NewUsersReport";
import UsersWithoutDevicesReport from "../../../../Components/Reports/UsersWithoutDevicesReport";
import PageContainer from "../../../../Components/Reports/PageContainer";
import SectionTitle from "../../../../Components/Reports/SectionTitle";
import UsersPerDepartmentReport from "../../../../Components/Reports/UsersPerDepartmentReport";
import InactiveUsersReport from "../../../../Components/Reports/InactiveUsersReport";
import AccountStatusReport from "../../../../Components/Reports/AccountStatusReport";

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
