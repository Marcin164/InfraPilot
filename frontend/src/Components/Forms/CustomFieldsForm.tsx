import { useTranslation } from "react-i18next";
import Input from "../Inputs/Input";
import Checkbox from "../Inputs/Checkbox";
import SelectSecondary from "../Inputs/SelectSecondary";
import type { CustomFieldDef } from "../../Services/ticketWorkflows";
import { isCustomFieldMissing } from "../../Helpers/forms";

type Props = {
  fields: CustomFieldDef[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  /** Show inline "required" errors -- set once the user has tried to submit. */
  showErrors?: boolean;
};

const CustomFieldsForm = ({ fields, values, onChange, showErrors }: Props) => {
  const { t } = useTranslation();

  if (fields.length === 0) return null;

  return (
    <div className="space-y-1">
      {fields.map((f) => {
        const value = values[f.id];
        const missing = Boolean(showErrors) && isCustomFieldMissing(f, value);
        const label = f.required ? `${f.label} *` : f.label;

        if (f.type === "textarea") {
          return (
            <div key={f.id} className="pt-2">
              <label className="font-bold text-[#3C3C3C]">{label}</label>
              <textarea
                rows={3}
                value={(value as string) ?? ""}
                onChange={(e) => onChange(f.id, e.target.value)}
                className="mt-[6px] w-full resize-none rounded-[10px] border border-[#535353] bg-white px-3 py-2 text-[16px] font-bold"
              />
              {missing && (
                <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
                  {t("form.field.required")}
                </em>
              )}
            </div>
          );
        }

        if (f.type === "select") {
          return (
            <div key={f.id} className="pt-2">
              <SelectSecondary
                label={label}
                options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                value={value ? { value: value as string, label: value as string } : null}
                onSelect={(opt: any) => onChange(f.id, opt?.value ?? "")}
              />
              {missing && (
                <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
                  {t("form.field.required")}
                </em>
              )}
            </div>
          );
        }

        if (f.type === "checkbox") {
          return (
            <div key={f.id} className="pt-2">
              <Checkbox
                id={`custom-field-${f.id}`}
                checked={Boolean(value)}
                handleChange={(v: boolean) => onChange(f.id, v)}
                label={label}
              />
              {missing && (
                <em role="alert" className="text-[14px] text-[#BC0E0E] font-bold">
                  {t("form.field.required")}
                </em>
              )}
            </div>
          );
        }

        return (
          <Input
            key={f.id}
            label={label}
            type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
            value={(value as string | number | undefined) ?? ""}
            handleChange={(v: string) =>
              onChange(f.id, f.type === "number" ? (v === "" ? "" : Number(v)) : v)
            }
            errors={missing ? t("form.field.required") : undefined}
          />
        );
      })}
    </div>
  );
};

export default CustomFieldsForm;
