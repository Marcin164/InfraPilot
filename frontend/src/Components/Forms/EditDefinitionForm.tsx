import { useAuthInfo } from "@propelauth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  getCalendar,
  patchSlaDefinition,
  postSlaDefinition,
} from "../../Services/sla";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import SelectSecondary from "../Inputs/SelectSecondary";
import ButtonSecondary from "../Buttons/ButtonSecondary";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import {
  requiredNumberValidator,
  requiredValidator,
} from "../../Helpers/validators";

type Props = {
  data?: any;
};

const EditDefinitionForm = ({ data }: Props) => {
  console.log(data);
  const { accessToken } = useAuthInfo();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      console.log(values);
      data
        ? patchSlaDefinition(accessToken, values)
        : postSlaDefinition(accessToken, values);
    },

    onSuccess: async () => {
      toast.success(
        `Definition has been ${data ? "updated" : "created"} successfully`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["calendars"] }),
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
      ]);
    },

    onError: () => {
      toast.error("Cannot change definition");
    },
  });

  const calendarQuery = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => getCalendar(accessToken),
  });

  const form = useForm({
    defaultValues: data ?? {
      name: "",
      targetMinutes: 0,
      type: "",
      calendarId: "",
    },
    onSubmit: ({ value }) => {
      console.log(value);
      mutation.mutate(value);
    },
  });

  if (!calendarQuery.data) return null;

  const calendarOptions = calendarQuery.data.map((calendar: any) => {
    return { value: calendar.id, label: calendar.name };
  });

  const slaTypeOptions = [
    { value: "RESPONSE", label: "Response" },
    { value: "RESOLUTION", label: "Resolution" },
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
            label="Name"
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
            label="Target Minutes"
            type="number"
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />
      <form.Field
        name="type"
        children={(field) => (
          <SelectSecondary
            label="Type"
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
        text={data ? "Update" : "Create"}
        className="mt-4"
      />
    </form>
  );
};

export default EditDefinitionForm;
