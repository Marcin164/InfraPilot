export const parseToDeviceTable = (data: any) => {
  if (!data) return [];

  const deviceTableDataArray = data.map((d: any) => {
    const deviceTableData = {
      id: d?.iddevices,
      device: d?.model,
      assignee: d?.owner,
      state: d?.state,
      assetName: d?.scanInfo
        ? JSON.parse(d.scanInfo).system_info?.hostname
        : "",
      serialNumber: d?.serialNumber,
      varranty: new Date(),
    };

    return deviceTableData;
  });

  return deviceTableDataArray;
};

export const parseToUsersTable = (data: any) => {
  if (!data) return [];

  const usersTableDataArray = data.map((d: any) => {
    const usersTableData = {
      id: d?.idusers,
      name: d?.name + " " + d?.surname,
      username: d?.username,
      currentDevice: "Macbook M3 Pro",
      lastLogon: "24/04/2025, 18:25",
      department: d?.department,
      office: d?.office,
    };

    return usersTableData;
  });

  return usersTableDataArray;
};
