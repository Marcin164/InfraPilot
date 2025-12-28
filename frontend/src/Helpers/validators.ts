export const requiredValidator = (value?: string) =>
  !value?.trim() ? "Field required" : null;
