import React, { useState } from "react";
import PageContainer from "../components/PageContainer";
import DeviceAgeReport from "../components/DeviceAgeReport";
import DeviceHealthReport from "../components/DeviceHealthReport";
import DevicesByOSReport from "../components/DevicesByOSReport";
import DevicesByTypeReport from "../components/DevicesByTypeReport";
import DevicesPerDepartmentReport from "../components/DevicesPerDepartmentReport";

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
