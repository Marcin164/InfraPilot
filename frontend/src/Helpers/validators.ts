export const requiredValidator = (value?: string) =>
  !value?.trim() ? "Field required" : null;

const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg"];

export const imageFileValidator = (file?: File | null) => {
  if (!file) return null;
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const isAllowed =
    ALLOWED_IMAGE_MIME_TYPES.includes(file.type) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  return isAllowed ? null : "Unsupported file type";
};

export const requiredNumberValidator = (value?: string | number) => {
  if (value === undefined || value === null || value === "") {
    return "Must be a number";
  }

  if (typeof value === "string" && !/^\d+(\.\d+)?$/.test(value)) {
    return "Must be a number";
  }

  return Number.isFinite(Number(value)) ? null : "Must be a number";
};
