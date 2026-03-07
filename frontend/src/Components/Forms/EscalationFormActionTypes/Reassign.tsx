import React from "react";
import { requiredValidator } from "../../../Helpers/validators";
import Input from "../../Inputs/Input";

type Props = { form: any; actionConfig?: any };

const Reassign = ({ form, actionConfig }: Props) => {
  return (
    <>
      <form.Field
        name="targetGroup"
        validators={{
          onChange: ({ value }: any) => requiredValidator(value),
        }}
        children={(field: any) => (
          <Input
            {...field}
            value={field?.state?.value}
            label="Target Group"
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />
    </>
  );
};

export default Reassign;
