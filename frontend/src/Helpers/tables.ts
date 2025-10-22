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
