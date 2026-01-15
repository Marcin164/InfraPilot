import React from "react";
import SelectSecondary from "../Inputs/SelectSecondary";
import { useForm } from "@tanstack/react-form";
import Input from "../Inputs/Input";
import { closureCodesOptions } from "../../Constants/options";

type Props = {};

const ClosureNotesForm = (props: Props) => {
  const form = useForm({
    defaultValues: {},
    onSubmit: ({ value }) => {
      // mutation.mutate(value);
    },
  });

  const handleSelect = (opt: any, field: any) => {
    field.handleChange(opt.value);
  };
  return (
    <form>
      <form.Field
        name="code"
        children={(field) => (
          <SelectSecondary
            label="Code"
            options={closureCodesOptions}
            value=""
            onSelect={(opt: any) => handleSelect(opt, field)}
          />
        )}
      />
      <form.Field
        name="notes"
        children={(field) => (
          <Input {...field} label="Notes" value={field.state.value} />
        )}
      />
    </form>
  );
};

export default ClosureNotesForm;
