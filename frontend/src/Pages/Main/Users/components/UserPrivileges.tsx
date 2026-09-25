import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { faUniversalAccess, faPen } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { getCustomRoles, getCustomRoleAssignments } from "../../../../Services/customRoles";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

type Props = {
  userId: string;
};

const UserPrivileges = ({ userId }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const permissionsQuery = usePermissions();
  const canManageRoles = hasPermission(
    "admin.roleAssignment.manage",
    permissionsQuery.data,
  );

  const rolesQuery = useQuery({
    queryKey: ["custom-roles"],
    queryFn: getCustomRoles,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["custom-role-assignments", userId],
    queryFn: () => getCustomRoleAssignments([userId]),
    enabled: Boolean(userId),
  });

  const assignedRoleIds = assignmentsQuery.data?.[userId] ?? [];
  const assignedRoles = (rolesQuery.data ?? []).filter((role) =>
    assignedRoleIds.includes(role.id),
  );

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text={t("users.privileges")} icon={faUniversalAccess} />
      <div className="mt-3 flex flex-wrap gap-2">
        {assignedRoles.length > 0 ? (
          assignedRoles.map((role) => (
            <span
              key={role.id}
              className="rounded-full bg-[#EEF5FD] text-[#2B9AE9] text-[12px] font-semibold px-3 py-1"
            >
              {role.name}
            </span>
          ))
        ) : (
          <div className="text-[13px] text-[#9a9a9a]">
            {t("users.privileges.empty")}
          </div>
        )}
      </div>
      {canManageRoles && (
        <div className="py-2">
          <ButtonPrimary
            icon={faPen}
            text={t("users.privileges.manage")}
            onClick={() => navigate("/admin/settings/admin")}
          />
        </div>
      )}
    </div>
  );
};

export default UserPrivileges;
