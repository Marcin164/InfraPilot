import React from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { updateUser } from "../../../../Services/users";
import { useParams } from "react-router";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faUniversalAccess } from "@fortawesome/free-solid-svg-icons";

type Props = {
  data: {
    isApprover: boolean;
    isAdmin: boolean;
  };
};

const UserPrivileges = ({ data }: Props) => {
  const { t } = useTranslation();
  const params = useParams();

  const mutation = useMutation({
    mutationFn: (data: any) => updateUser(data, params.id!),
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
      <CardHeader text={t("users.privileges")} icon={faUniversalAccess} />

      <form className="flex flex-col gap-2 mt-2">
        <form.Field
          name="isApprover"
          children={(field) => (
            <Checkbox
              id="isApprover"
              label={t("users.privileges.approver")}
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
              label={t("users.privileges.admin")}
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
