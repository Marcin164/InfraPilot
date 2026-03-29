import React from "react";
import PageContainer from "../components/PageContainer";
import DevicesWithoutUpdatesReport from "../components/DevicesWithoutUpdatesReport";
import DevicesWithoutAVReport from "../components/DevicesWithoutAVReport";
import LocalAdminUsersReport from "../components/LocalAdminUsersReport";
import DevicesOutsideDomainReport from "../components/DevicesOutsideDomainReport";
import DeviceAgeReport from "../components/DeviceAgeReport";
import DevicesWithoutOwnerReport from "../components/DevicesWithoutOwnerReport";

type Props = {};

const SecurityReports = (props: Props) => {
  return (
    <PageContainer>
      <DevicesWithoutUpdatesReport />
      <DevicesWithoutAVReport />
      <LocalAdminUsersReport />
      <DevicesOutsideDomainReport />
      <DeviceAgeReport />
      <DevicesWithoutOwnerReport />
    </PageContainer>
  );
};

export default SecurityReports;
