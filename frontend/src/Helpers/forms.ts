import type { CustomFieldDef } from "../Services/ticketWorkflows";

export const isCustomFieldMissing = (field: CustomFieldDef, value: unknown) => {
  if (!field.required) return false;
  // A required checkbox must be ticked -- "false" is a real answer for an
  // optional one, but for a required one it means the box isn't checked yet.
  if (field.type === "checkbox") return value !== true;
  return value === undefined || value === null || value === "";
};

export const customFieldsAreValid = (
  fields: CustomFieldDef[],
  values: Record<string, unknown>,
) => fields.every((f) => !isCustomFieldMissing(f, values[f.id]));

export const parseWorkdays = (workdays: number[]) => {
  const sortedWorkdays = workdays
    .sort((a, b) => a - b)
    .map((day: any) => {
      switch (day) {
        case 1:
          return "Mon";
        case 2:
          return "Tue";
        case 3:
          return "Wed";
        case 4:
          return "Thu";
        case 5:
          return "Fri";
        case 6:
          return "Sat";
        case 7:
          return "Sun";
        default:
          return "";
      }
    });

  return sortedWorkdays;
};
