import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useParams } from "react-router";
import { faUniversalAccess } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import { updateUser } from "../../../../Services/users";
import { getSodMatrix } from "../../../../Services/rbac";
import { ROLE_DEFS, computeRowSoD, type RoleKey } from "../../../../Constants/roles";

type Props = {
  data: Record<RoleKey, boolean>;
};

const UserPrivileges = ({ data }: Props) => {
  const { t } = useTranslation();
  const params = useParams();
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const sodQuery = useQuery({
    queryKey: ["rbac-sod"],
    queryFn: getSodMatrix,
    staleTime: 5 * 60 * 1000,
  });
  const sodPairs = sodQuery.data?.pairs ?? [];

  const mutation = useMutation({
    mutationFn: (patch: Partial<Record<RoleKey, boolean>>) => updateUser(patch, params.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const form = useForm({
    defaultValues: data,
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const sod = computeRowSoD(form.state.values, sodPairs, t);

  const handleCheckboxChange = (field: any, roleKey: RoleKey, checked: boolean) => {
    askConfirm(() => {
      field.handleChange(checked);
      form.handleSubmit();
    }, t(
      checked ? "settings.admin.roles.confirmGrantSelf" : "settings.admin.roles.confirmRevokeSelf",
      { role: t(ROLE_DEFS.find((r) => r.key === roleKey)!.labelKey) },
    ));
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.privileges")} icon={faUniversalAccess} />
      <form className="flex flex-col gap-2 mt-3">
        {ROLE_DEFS.map((def) => (
          <form.Field
            key={def.key}
            name={def.key}
            children={(field) => (
              <div title={sod[def.key].reason ?? undefined}>
                <Checkbox
                  id={`user-privilege-${def.key}`}
                  label={t(def.labelKey)}
                  color={def.color}
                  name={field.name}
                  checked={field.state.value}
                  disabled={mutation.isPending || sod[def.key].disabled}
                  handleChange={(checked: boolean) =>
                    handleCheckboxChange(field, def.key, checked)
                  }
                />
              </div>
            )}
          />
        ))}
      </form>
      <ConfirmationModal
        isModalOpen={confirmState.open}
        handleOnClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onDelete={() => { confirmState.onConfirm(); setConfirmState((s) => ({ ...s, open: false })); }}
        message={confirmState.message}
      />
    </div>
  );
};

export default UserPrivileges;
