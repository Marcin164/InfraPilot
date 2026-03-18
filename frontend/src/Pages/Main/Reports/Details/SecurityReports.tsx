import React from "react";
import PageContainer from "../../../../Components/Reports/PageContainer";
import DevicesWithoutUpdatesReport from "../../../../Components/Reports/DevicesWithoutUpdatesReport";
import DevicesWithoutAVReport from "../../../../Components/Reports/DevicesWithoutAVReport";
import LocalAdminUsersReport from "../../../../Components/Reports/LocalAdminUsersReport";
import DevicesOutsideDomainReport from "../../../../Components/Reports/DevicesOutsideDomainReport";
import DeviceAgeReport from "../../../../Components/Reports/DeviceAgeReport";
import DevicesWithoutOwnerReport from "../../../../Components/Reports/DevicesWithoutOwnerReport";

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
