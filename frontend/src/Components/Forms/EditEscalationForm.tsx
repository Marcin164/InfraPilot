import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-toastify";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import SelectSecondary from "../Inputs/SelectSecondary";
import Input from "../Inputs/Input";
import { requiredValidator } from "../../Helpers/validators";
import {
  getSlaDefinitions,
  patchSlaEscalation,
  postSlaEscalation,
} from "../../Services/sla";
import Notify from "./EscalationFormActionTypes/Notify";
import Reassign from "./EscalationFormActionTypes/Reassign";
import PriorityUp from "./EscalationFormActionTypes/PriorityUp";

type Props = { data: any };

type EscalationForm = {
  slaDefinitionId: string;
  triggerPercentage: number;
  actionType: "NOTIFY" | "REASSIGN" | "PRIORITY_UP";
  actionConfig: {
    channel?: string;
    recipients?: string;
    targetPriority?: string;
    targetGroup?: string;
  };
};

const EditEscalationForm = ({ data }: Props) => {
  const queryClient = useQueryClient();

  const definitionsQuery = useQuery({
    queryKey: ["definitions"],
    queryFn: () => getSlaDefinitions(),
  });

  const mutation = useMutation({
    mutationFn: (values: any) =>
      data ? patchSlaEscalation(values) : postSlaEscalation(values),

    onSuccess: async () => {
      toast.success("Escalation updated");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
        queryClient.invalidateQueries({ queryKey: ["escalations"] }),
      ]);
    },

    onError: () => {
      toast.error("Cannot change escalation");
    },
  });

  const form = useForm({
    defaultValues: data ?? {
      slaDefinitionId: "",
      triggerPercentage: "",
      actionType: "NOTIFY",
      actionConfig: {
        channel: "",
        recipients: "",
        targetPriority: "",
        targetGroup: "",
      },
    },

    onSubmit: ({ value }) => {
      console.log(value);
      mutation.mutate(value);
    },
  });

  const definitionOptions =
    definitionsQuery.data?.map((definition: any) => ({
      value: definition.id,
      label: definition.name,
    })) ?? [];

  const actionTypeOptions = [
    { value: "NOTIFY", label: "Notify" },
    { value: "REASSIGN", label: "Reassign" },
    { value: "PRIORITY_UP", label: "Priority Up" },
  ];

  return (
    <form
      onSubmit={(e) => {
        console.log("Dziala");
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="slaDefinitionId">
        {(field) => (
          <SelectSecondary
            label="Definition"
            options={definitionOptions}
            value={definitionOptions.find(
              (o: any) => o.value === field.state.value,
            )}
            onSelect={(option: any) => field.handleChange(option.value)}
          />
        )}
      </form.Field>

      <form.Field
        name="triggerPercentage"
        validators={{
          onChange: ({ value }) => requiredValidator(value),
        }}
      >
        {(field) => (
          <Input
            label="Trigger Percentage"
            suffix="%"
            value={field.state.value}
            onChange={(e: any) => field.handleChange(e.target.value)}
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      </form.Field>

      <form.Field name="actionType">
        {(field) => (
          <SelectSecondary
            label="Action Type"
            options={actionTypeOptions}
            value={actionTypeOptions.find((o) => o.value === field.state.value)}
            onSelect={(option: any) => field.handleChange(option.value)}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.actionType}>
        {(actionType) => (
          <>
            {actionType === "NOTIFY" && <Notify form={form} />}
            {actionType === "REASSIGN" && <Reassign form={form} />}
            {actionType === "PRIORITY_UP" && <PriorityUp form={form} />}
          </>
        )}
      </form.Subscribe>

      <ButtonPrimary type="submit" text="Save changes" className="mt-4" />
    </form>
  );
};

export default EditEscalationForm;
