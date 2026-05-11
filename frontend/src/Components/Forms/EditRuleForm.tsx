import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
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

import type { SlaDefinition, SlaRule } from "../../Types";

type Props = {
  data?: SlaRule;
};

const EditRuleForm = ({ data }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      data ? patchSlaRule(values) : postSlaRule(values);
    },

    onSuccess: async () => {
      toast.success(
        data ? t("toast.success.ruleUpdated") : t("toast.success.ruleCreated"),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["rules"] }),
        queryClient.invalidateQueries({ queryKey: ["definitions"] }),
        queryClient.invalidateQueries({ queryKey: ["calendars"] }),
      ]);
    },

    onError: () => {
      toast.error(t("toast.error.ruleChange"));
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
    if (!definitionQuery.data) return [];
    return definitionQuery.data.map((def: SlaDefinition) => ({
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
              label={t("form.priority")}
              options={[
                { value: "Low", label: t("form.priority.low") },
                { value: "Medium", label: t("form.priority.medium") },
                { value: "High", label: t("form.priority.high") },
                { value: "Critical", label: t("form.priority.critical") },
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
              label={t("form.ticketType")}
              options={[
                { value: null, label: t("form.ticketType.any") },
                { value: "Incident", label: t("form.ticketType.incident") },
                { value: "Service", label: t("form.ticketType.service") },
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
              label={t("form.definition")}
              options={definitionOptions}
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

export default EditRuleForm;
