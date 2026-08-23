import { useState } from "react";
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
import DurationInput from "../Inputs/DurationInput";
import SelectWithCreate from "../Inputs/SelectWithCreate";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import EditCalendarModal from "../Modals/EditCalendarModal";
import { requiredValidator } from "../../Helpers/validators";

import type { SlaCalendar, SlaDefinition } from "../../Types";

type Props = {
  data?: SlaDefinition;
  onSaved?: (definition: SlaDefinition) => void;
};

type DefinitionFormValues = {
  name: string;
  calendarId: string;
  responseMinutes: number | null;
  resolutionMinutes: number | null;
};

const EditDefinitionForm = ({ data, onSaved }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateCalendarOpen, setIsCreateCalendarOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: async (values: DefinitionFormValues) => {
      return data ? patchSlaDefinition(data.id, values) : postSlaDefinition(values);
    },

    onSuccess: async (result) => {
      toast.success(
        data ? t("toast.success.definitionUpdated") : t("toast.success.definitionCreated"),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["calendars"] }),
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
      ]);

      onSaved?.(result);
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
    defaultValues: {
      name: data?.name ?? "",
      calendarId: data?.calendar?.id ?? data?.calendarId ?? "",
      responseMinutes: data?.responseMinutes ?? null,
      resolutionMinutes: data?.resolutionMinutes ?? null,
    } as DefinitionFormValues,
    onSubmit: ({ value }) => {
      if (!value.responseMinutes && !value.resolutionMinutes) return;
      mutation.mutate(value);
    },
  });

  if (!calendarQuery.data) return null;

  const calendarOptions = calendarQuery.data.map((calendar: SlaCalendar) => {
    return { value: calendar.id, label: calendar.name };
  });

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
        name="calendarId"
        children={(field) => {
          const selectedOption =
            calendarOptions.find((option: any) => option.value === field.state.value) ?? null;

          return (
            <>
              <SelectWithCreate
                label={t("form.calendar")}
                options={calendarOptions}
                value={selectedOption}
                onSelect={(opt: any) => field.handleChange(opt?.value ?? "")}
                createLabel={t("settings.calendars.createNew")}
                onCreateNew={() => setIsCreateCalendarOpen(true)}
              />
              <EditCalendarModal
                data={null}
                isModalOpen={isCreateCalendarOpen}
                handleOnClose={() => setIsCreateCalendarOpen(false)}
                onCreated={(calendar) => field.handleChange(calendar.id)}
              />
            </>
          );
        }}
      />
      <form.Field
        name="responseMinutes"
        children={(field) => (
          <DurationInput
            label={t("form.responseMinutes")}
            valueMinutes={field.state.value}
            onChangeMinutes={field.handleChange}
          />
        )}
      />
      <form.Field
        name="resolutionMinutes"
        children={(field) => (
          <DurationInput
            label={t("form.resolutionMinutes")}
            valueMinutes={field.state.value}
            onChangeMinutes={field.handleChange}
          />
        )}
      />
      <form.Subscribe selector={(state) => [state.values.responseMinutes, state.values.resolutionMinutes]}>
        {([responseMinutes, resolutionMinutes]) =>
          !responseMinutes && !resolutionMinutes ? (
            <em role="alert" className="block pt-2 text-[14px] text-[#BC0E0E] font-bold">
              {t("form.error.atLeastOneDuration")}
            </em>
          ) : null
        }
      </form.Subscribe>
      <ButtonPrimary
        type="submit"
        text={data ? t("common.update") : t("common.create")}
        className="mt-4"
      />
    </form>
  );
};

export default EditDefinitionForm;
