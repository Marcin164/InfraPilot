export const requiredValidator = (value?: string) =>
  !value?.trim() ? "Field required" : null;

export const requiredNumberValidator = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return "Must be a number";
  }

  if (typeof value === "string" && !/^\d+(\.\d+)?$/.test(value)) {
    return "Must be a number";
  }

  return Number.isFinite(Number(value)) ? null : "Must be a number";
};
