import React from "react";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import { closureCodesOptions } from "../../Constants/options";
import { toast } from "react-toastify";
import { updateTicket } from "../../Services/tickets";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = {
  closureCode: any;
  closureNotes: any;
};

const ClosureNotesForm = ({ closureCode, closureNotes }: Props) => {
  const params = useParams();
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return updateTicket(params.id!, values);
    },

    onSuccess: () => {
      toast.success("Ticket updated!");
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
            label="Code"
            options={closureCodesOptions}
            value={closureCodesOptions.find((opt) => opt.value === closureCode)}
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="closureNotes"
        children={(field) => (
          <Input {...field} label="Notes" defaultValue={closureNotes} />
        )}
      />
      <ButtonPrimary type="submit" text="Add notes" className="mt-4 mb-2" />
    </form>
  );
};

export default ClosureNotesForm;
