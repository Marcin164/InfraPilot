import React from "react";
import { useTranslation } from "react-i18next";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import { closureCodesOptions } from "../../Constants/options";
import { toast } from "react-toastify";
import { updateTicket } from "../../Services/tickets";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router";
import ButtonPrimary from "../Buttons/ButtonPrimary";

import type { ClosureCode, UpdateTicketData } from "../../Types";

type Props = {
  closureCode?: ClosureCode;
  closureNotes?: string;
};

const ClosureNotesForm = ({ closureCode, closureNotes }: Props) => {
  const { t } = useTranslation();
  const params = useParams();
  const trClosure = closureCodesOptions.map((o) => ({ ...o, label: t(o.label) }));
  const mutation = useMutation({
    mutationFn: async (values: UpdateTicketData) => {
      return updateTicket(params.id!, values);
    },

    onSuccess: () => {
      toast.success(t("toast.success.ticketUpdated"));
    },
  });

  const form = useForm({
    defaultValues: {},
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleSelect = (opt: any, field: any) => {
    field.handleChange(opt.value);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="closureCode"
        children={(field) => (
          <SelectSecondary
            label={t("form.field.closureCode")}
            options={trClosure}
            value={trClosure.find((opt) => opt.value === closureCode)}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="closureNotes"
        children={(field) => (
          <Input {...field} label={t("form.field.closureNotes")} defaultValue={closureNotes} />
        )}
      />
      <ButtonPrimary type="submit" text={t("common.save")} className="mt-4 mb-2" />
    </form>
  );
};

export default ClosureNotesForm;
