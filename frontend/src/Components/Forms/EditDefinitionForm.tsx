import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  getCalendar,
  patchSlaDefinition,
  postSlaDefinition,
} from "../../Services/sla";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import {
  requiredNumberValidator,
  requiredValidator,
} from "../../Helpers/validators";

import type { SlaCalendar, SlaDefinition } from "../../Types";

type Props = {
  data?: SlaDefinition;
};

const EditDefinitionForm = ({ data }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      data ? patchSlaDefinition(values) : postSlaDefinition(values);
    },

    onSuccess: async () => {
      toast.success(
        data ? t("toast.success.definitionUpdated") : t("toast.success.definitionCreated"),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["calendars"] }),
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
      ]);
    },

    onError: () => {
      toast.error(t("toast.error.definitionChange"));
    },
  });

  const calendarQuery = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => getCalendar(),
  });

  const form = useForm({
    defaultValues: data ?? {
      name: "",
      targetMinutes: 0,
      type: "",
      calendarId: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  if (!calendarQuery.data) return null;

  const calendarOptions = calendarQuery.data.map((calendar: SlaCalendar) => {
    return { value: calendar.id, label: calendar.name };
  });

  const slaTypeOptions = [
    { value: "RESPONSE", label: t("form.type.response") },
    { value: "RESOLUTION", label: t("form.type.resolution") },
  ];

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
        name="targetMinutes"
        validators={{
          onChange: ({ value }) => requiredNumberValidator(value),
        }}
        children={(field) => (
          <Input
            {...field}
            value={field?.state?.value}
            label={t("form.targetMinutes")}
            type="number"
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />
      <form.Field
        name="type"
        children={(field) => (
          <SelectSecondary
            label={t("form.type")}
            options={slaTypeOptions}
            value={slaTypeOptions.find(
              (option: any) => option.value === data?.type,
            )}
            onSelect={(opt: any) => field.handleChange(opt.value)}
          />
        )}
      />
      <form.Field
        name="calendarId"
        children={(field) => {
          const selectedOption =
            calendarOptions.find(
              (option: any) => option.value === data?.calendar?.id,
            ) ?? null;

          return (
            <SelectSecondary
              label="Calendar"
              options={calendarOptions}
              value={selectedOption}
              onSelect={(opt: any) => field.handleChange(opt.value)}
            />
          );
        }}
      />
      <ButtonPrimary
        type="submit"
        text={data ? t("common.update") : t("common.create")}
        className="mt-4"
      />
    </form>
  );
};

export default EditDefinitionForm;
