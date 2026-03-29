import React, { useMemo } from "react";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSlaDefinitions,
  patchSlaRule,
  postSlaRule,
} from "../../Services/sla";
import { toast } from "react-toastify";

type Props = {
  data?: any;
};

const EditRuleForm = ({ data }: Props) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      data ? patchSlaRule(values) : postSlaRule(values);
    },

    onSuccess: async () => {
      toast.success(
        `Rule has been ${data ? "updated" : "created"} successfully`,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["calendars"] }),
      ]);
    },

    onError: () => {
      toast.error("Cannot change rule");
    },
  });

  const form = useForm({
    defaultValues: data ?? {
      priority: "",
      ticketType: "",
      definitionId: "",
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const definitionQuery = useQuery({
    queryKey: ["definitions"],
    queryFn: async () => getSlaDefinitions(),
  });

  const definitionOptions = useMemo(() => {
    if (!definitionQuery.data) return null;
    return definitionQuery.data.map((def: any) => ({
      value: def.id,
      label: def.name,
    }));
  }, [definitionQuery.data]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="priority"
        children={(field) => {
          const value = field.state.value
            ? { value: field.state.value, label: field.state.value }
            : null;

          return (
            <SelectSecondary
              label="Priority"
              options={[
                { value: "Low", label: "Low" },
                { value: "Medium", label: "Medium" },
                { value: "High", label: "High" },
                { value: "Critical", label: "Critical" },
              ]}
              value={value}
              onSelect={(opt: any) => field.handleChange(opt.value)}
            />
          );
        }}
      />
      <form.Field
        name="ticketType"
        children={(field) => {
          const value = field.state.value
            ? { value: field.state.value, label: field.state.value }
            : null;

          return (
            <SelectSecondary
              label="Ticket Type"
              options={[
                { value: null, label: "Any" },
                { value: "Incident", label: "Incident" },
                { value: "Service", label: "Service" },
              ]}
              value={value}
              onSelect={(opt: any) => field.handleChange(opt.value)}
            />
          );
        }}
      />
      <form.Field
        name="definitionId"
        children={(field) => {
          const selectedOption = definitionOptions.find(
            (option: any) => option.value === data?.slaDefinition?.id,
          );

          return (
            <SelectSecondary
              label="Definition"
              options={definitionOptions}
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

export default EditRuleForm;
