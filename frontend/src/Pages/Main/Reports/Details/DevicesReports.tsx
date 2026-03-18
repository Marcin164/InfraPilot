import React, { useState } from "react";
import PageContainer from "../../../../Components/Reports/PageContainer";
import DeviceAgeReport from "../../../../Components/Reports/DeviceAgeReport";
import DeviceHealthReport from "../../../../Components/Reports/DeviceHealthReport";
import DevicesByOSReport from "../../../../Components/Reports/DevicesByOSReport";
import DevicesByTypeReport from "../../../../Components/Reports/DevicesByTypeReport";
import DevicesPerDepartmentReport from "../../../../Components/Reports/DevicesPerDepartmentReport";

type Props = {};

const DevicesReports = (props: Props) => {
  return (
    <PageContainer>
      <DeviceAgeReport />
      <DeviceHealthReport />
      <DevicesByOSReport />
      <DevicesByTypeReport />
      <DevicesPerDepartmentReport />
    </PageContainer>
  );
};

export default DevicesReports;
