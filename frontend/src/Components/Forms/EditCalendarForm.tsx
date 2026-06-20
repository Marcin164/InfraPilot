import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Input from "../Inputs/Input";
import SelectSecondary from "../Inputs/SelectSecondary";
import { WEEK_DAYS } from "../../Constants/forms";
import Checkbox from "../Inputs/Checkbox";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import { useMemo } from "react";
import { patchCalendar, postCalendar } from "../../Services/sla";
import { requiredValidator } from "../../Helpers/validators";

import type { SlaCalendar } from "../../Types";

type Props = {
  data?: SlaCalendar;
};

const EditCalendarForm = ({ data }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      data ? patchCalendar(values) : postCalendar(values);
    },

    onSuccess: async () => {
      toast.success(t("toast.success.calendarChanged"));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["calendars"] }),
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
      ]);
    },

    onError: () => {
      toast.error(t("toast.error.calendarChange", "Cannot change calendar"));
    },
  });

  const form = useForm({
    defaultValues: data ?? {
      name: "",
      timezone: "",
      workingDays: [] as number[],
      workStart: "09:00",
      workEnd: "17:00",
    },
    onSubmit: ({ value }: any) => {
      value.holidays = value.holidays.map((holiday: any) => {
        return {
          date: holiday,
          description: "",
        };
      });
      mutation.mutate(value);
    },
  });

  const handleCheckboxChange = (field: any, day: any, e: any) => {
    const isChecked = e.target.checked;

    field.handleChange(
      isChecked
        ? [...field.state.value, day.value]
        : field.state.value.filter((d: any) => d !== day.value),
    );
  };

  const intl: any = Intl;

  const timezones = useMemo(() => {
    return intl
      .supportedValuesOf("timeZone")
      .sort((a: any, b: any) => a.localeCompare(b))
      .map((tz: any) => ({ label: tz, value: tz }));
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => requiredValidator(value),
        }}
        children={(field) => (
          <Input
            {...field}
            value={field?.state?.value}
            label={t("form.name")}
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />
      <form.Field
        name="timezone"
        children={(field) => (
          <SelectSecondary
            label={t("form.field.timezone", "Timezone")}
            options={timezones}
            value={{ label: field.state.value, value: field.state.value }}
            onSelect={(value: any) => field.handleChange(value.value)}
          />
        )}
      />
      <form.Field name="workingDays">
        {(field) => (
          <div className="pt-4 mb-4">
            <label className="font-bold text-[#3C3C3C]">{t("form.field.workingDays", "Working days")}</label>
            <div className="space-y-2">
              {WEEK_DAYS.map((day) => {
                const checked = field?.state?.value?.includes(day?.value);

                return (
                  <Checkbox
                    id={day.value.toString()}
                    key={day.value}
                    label={t(day.label)}
                    checked={checked}
                    onChange={(e: any) => handleCheckboxChange(field, day, e)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="workStart"
          children={(field) => (
            <Input
              type="time"
              value={field?.state?.value ?? ""}
              handleChange={field.handleChange}
              label={t("form.field.workStart", "Work start")}
            />
          )}
        />
        <form.Field
          name="workEnd"
          children={(field) => (
            <Input
              type="time"
              value={field?.state?.value ?? ""}
              handleChange={field.handleChange}
              label={t("form.field.workEnd", "Work end")}
            />
          )}
        />
      </div>
      <ButtonPrimary type="submit" text={t("common.save")} />
    </form>
  );
};

export default EditCalendarForm;
