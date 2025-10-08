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

export const getSearchedData = (data: any, searchValue: any) => {
  if (!searchValue) return data;

  return data.filter((d: any) =>
    Object.values(d).some((value: any) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchValue.toLowerCase());
      }
      return false;
    })
  );
};

export const getFilteredData = (data: any, filterOptions: any) => {
  const arrayLength = Object.values(filterOptions).reduce(
    (acc, arr: any) => acc + arr.length,
    0
  );

  if (arrayLength === 0) return data;

  return data.filter((d: any) =>
    Object.entries(filterOptions).every(([key, optionsArray]: any) => {
      if (!optionsArray.length) return true;
      return optionsArray.includes(d[key]);
    })
  );
};
