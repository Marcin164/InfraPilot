import React from "react";
import { requiredValidator } from "../../../Helpers/validators";
import Input from "../../Inputs/Input";

type Props = { form: any; actionConfig?: any };

const PriorityUp = ({ form }: Props) => {
  return (
    <>
      <form.Field
        name="targetPriority"
        validators={{
          onChange: ({ value }: any) => requiredValidator(value),
        }}
        children={(field: any) => (
          <Input
            {...field}
            value={field?.state?.value}
            label="Target Priority"
            errors={field.state.meta.errors?.join(", ")}
          />
        )}
      />
    </>
  );
};

export default PriorityUp;
