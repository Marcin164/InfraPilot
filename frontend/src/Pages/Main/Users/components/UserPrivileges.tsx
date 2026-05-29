import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useParams } from "react-router";
import { faUniversalAccess } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import { updateUser } from "../../../../Services/users";

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
    defaultValues: data ?? { isApprover: false, isAdmin: false },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const handleCheckboxChange = (field: any) => (checked: boolean) => {
    field.handleChange(checked);
    form.handleSubmit();
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.privileges")} icon={faUniversalAccess} />
      <form className="flex flex-col gap-2 mt-3">
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
