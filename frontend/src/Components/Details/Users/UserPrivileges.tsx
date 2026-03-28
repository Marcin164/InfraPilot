import React from "react";
import Checkbox from "../../Inputs/Checkbox";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { updateUser } from "../../../Services/users";
import { useAuthInfo } from "@propelauth/react";
import { useParams } from "react-router";

type Props = {
  data: {
    isApprover: boolean;
    isAdmin: boolean;
  };
};

const UserPrivileges = ({ data }: Props) => {
  const { accessToken } = useAuthInfo();
  const params = useParams();

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateUser(accessToken, { ...data, id: params.id }),
  });

  const form = useForm({
    defaultValues: data ?? {
      isApprover: false,
      isAdmin: false,
    },

    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleCheckboxChange = (field: any) => (checked: boolean) => {
    field.handleChange(checked);
    form.handleSubmit();
  };

  return (
    <div>
      <div className="text-[30px] font-semibold text-[#3C3C3C] pt-2">
        Privileges
      </div>

      <form className="flex flex-col gap-2 mt-2">
        <form.Field
          name="isApprover"
          children={(field) => (
            <Checkbox
              id="isApprover"
              label="Approver"
              name={field.name}
              checked={field.state.value}
              handleChange={handleCheckboxChange(field)}
            />
          )}
        />

        <form.Field
          name="isAdmin"
          children={(field) => (
            <Checkbox
              id="isAdmin"
              label="Admin"
              name={field.name}
              checked={field.state.value}
              handleChange={handleCheckboxChange(field)}
            />
          )}
        />
      </form>
    </div>
  );
};

export default UserPrivileges;
