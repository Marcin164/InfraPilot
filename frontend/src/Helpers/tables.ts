export const parseToDeviceTable = (data: any) => {
  if (!data) return [];

  const deviceTableDataArray = data.map((d: any) => {
    const deviceTableData = {
      id: d?.id,
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

export const parseToSoftwareTable = (data: any) => {
  if (!data) return [];

  const usersTableDataArray = data.map((d: any) => {
    let installationDate = "N/A";
    if (d?.install_date) {
      const year = d?.install_date.substring(0, 4);
      const month = d?.install_date.substring(4, 6);
      const day = d?.install_date.substring(6, 8);

      installationDate = `${day}.${month}.${year}`;
    }

    const usersTableData = {
      id: d?.idusers,
      name: d?.name,
      version: d?.version,
      publisher: d?.publisher,
      size: d?.size,
      installationDate: installationDate,
    };

    return usersTableData;
  });

  return usersTableDataArray;
};
