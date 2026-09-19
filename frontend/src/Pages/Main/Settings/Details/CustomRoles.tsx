import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faPen, faCheck, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import {
  CustomRole,
  PermissionCatalog,
  assignCustomRole,
  createCustomRole,
  deleteCustomRole,
  getCustomRoleAssignments,
  getCustomRoles,
  getPermissionCatalog,
  unassignCustomRole,
  updateCustomRole,
} from "../../../../Services/customRoles";
import { getUsersTable } from "../../../../Services/users";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import Search from "../../../../Components/Inputs/Search";
import MainTable from "../../../../Components/Tables/MainTable";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import Modal from "../../../../Components/Modals/AnimatedModal";
import { buildQuery } from "../../../../Helpers/queries";
import { useDebounce } from "../../../../Hooks/useDebounce";

/** Expands a role's stored permission codes with everything they imply, mirroring the backend's expandPermissions(). */
const expandCodes = (
  codes: string[],
  implies: Record<string, string[]>,
): Set<string> => {
  const result = new Set<string>();
  const queue = [...codes];
  while (queue.length > 0) {
    const code = queue.pop();
    if (!code || result.has(code)) continue;
    result.add(code);
    for (const implied of implies[code] ?? []) {
      if (!result.has(implied)) queue.push(implied);
    }
  }
  return result;
};

/* ────────────────── Permission checkbox grid ────────────────── */

export const PermissionCheckboxGrid = ({
  catalog,
  selected,
  disabled,
  onToggle,
}: {
  catalog: PermissionCatalog;
  selected: string[];
  disabled: boolean;
  onToggle: (code: string) => void;
}) => {
  const expanded = useMemo(
    () => expandCodes(selected, catalog.implies),
    [selected, catalog.implies],
  );
  const directly = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {catalog.groups.map((group) => (
        <div
          key={group.key}
          className="rounded-[10px] border border-[#E6E6E6] p-3"
        >
          <div className="text-[13px] font-bold text-[#3C3C3C] uppercase tracking-wide mb-2">
            {group.label}
          </div>
          <div className="space-y-1.5">
            {group.permissions.map((permission) => {
              const isChecked = expanded.has(permission.code);
              const isImpliedOnly = isChecked && !directly.has(permission.code);
              return (
                <Checkbox
                  key={permission.code}
                  id={`perm-${group.key}-${permission.code}`}
                  label={permission.label}
                  checked={isChecked}
                  disabled={disabled || isImpliedOnly}
                  handleChange={() => onToggle(permission.code)}
                  className="text-[13px]"
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────── Create/edit role modal ───────────────────────── */

type ModalTarget = "create" | CustomRole | null;

const CustomRoleModal = ({
  target,
  catalog,
  onClose,
}: {
  target: ModalTarget;
  catalog: PermissionCatalog;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const editingRole = target === "create" || target === null ? null : target;

  const [name, setName] = useState(editingRole?.name ?? "");
  const [description, setDescription] = useState(editingRole?.description ?? "");
  const [grantsAll, setGrantsAll] = useState(editingRole?.grantsAllPermissions ?? false);
  const [permissions, setPermissions] = useState<string[]>(editingRole?.permissions ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the draft only when the target role identity changes (not on every
  // field), so a background refetch of `role` mid-edit doesn't clobber
  // unsaved input.
  useEffect(() => {
    setName(editingRole?.name ?? "");
    setDescription(editingRole?.description ?? "");
    setGrantsAll(editingRole?.grantsAllPermissions ?? false);
    setPermissions(editingRole?.permissions ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingRole?.id]);

  const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ["custom-roles"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createCustomRole({
        name: name.trim(),
        description: description.trim() || undefined,
        grantsAllPermissions: grantsAll,
        permissions,
      }),
    onSuccess: () => {
      toast.success(t("settings.admin.customRoles.created"));
      invalidateRoles();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.customRoles.createFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCustomRole(editingRole!.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        grantsAllPermissions: grantsAll,
        permissions,
      }),
    onSuccess: () => {
      toast.success(t("settings.admin.customRoles.updated"));
      invalidateRoles();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.customRoles.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomRole(editingRole!.id),
    onSuccess: () => {
      toast.success(t("settings.admin.customRoles.deleted"));
      invalidateRoles();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.customRoles.deleteFailed")),
  });

  const togglePermission = (code: string) => {
    setPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    if (editingRole) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Modal
        classNames={{ modal: "w-[820px] max-w-full max-h-[85vh] overflow-y-auto rounded-[10px]" }}
        open={target !== null}
        onClose={onClose}
        center
      >
        <CardHeader
          text={
            editingRole
              ? t("settings.admin.customRoles.editTitle", { name: editingRole.name })
              : t("settings.admin.customRoles.createTitle")
          }
          icon={faUserShield}
        />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Name" value={name} onChange={(e: any) => setName(e.target.value)} />
          <Input
            label="Description"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <Checkbox
            id="grants-all-permissions"
            label={t("settings.admin.customRoles.grantsAll")}
            checked={grantsAll}
            handleChange={(checked: boolean) => setGrantsAll(checked)}
          />
        </div>

        {!grantsAll && (
          <div className="mt-3">
            <div className="text-[13px] font-bold text-[#3C3C3C] mb-2">
              {t("settings.admin.customRoles.permissions")}
            </div>
            <PermissionCheckboxGrid
              catalog={catalog}
              selected={permissions}
              disabled={false}
              onToggle={togglePermission}
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <div>
            {editingRole && (
              <span
                title={
                  editingRole.isBuiltIn
                    ? t("settings.admin.customRoles.deleteBuiltinTooltip")
                    : undefined
                }
              >
                <ButtonPrimary
                  icon={faTrash}
                  text={t("common.delete")}
                  onClick={() => setConfirmDelete(true)}
                  disabled={editingRole.isBuiltIn || deleteMutation.isPending}
                  color="red"
                />
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <ButtonPrimary text={t("common.cancel")} onClick={onClose} color="white" />
            <ButtonPrimary
              icon={faCheck}
              text={t("common.save")}
              onClick={handleSave}
              disabled={isSaving}
            />
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isModalOpen={confirmDelete}
        handleOnClose={() => setConfirmDelete(false)}
        onCancel={() => setConfirmDelete(false)}
        onDelete={() => {
          setConfirmDelete(false);
          deleteMutation.mutate();
        }}
        message={
          editingRole
            ? t("settings.admin.customRoles.deleteConfirm", { name: editingRole.name })
            : undefined
        }
      />
    </>
  );
};

/* ─────────────────────── Unified roles table ───────────────────────── */

const CustomRolesSection = ({ catalog }: { catalog: PermissionCatalog }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const debouncedSearch = useDebounce(searchValue, 400);
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);

  const rolesQuery = useQuery({ queryKey: ["custom-roles"], queryFn: getCustomRoles });

  const queryString = buildQuery({ search: debouncedSearch, page, limit });
  const usersQuery = useQuery({
    queryKey: ["users-custom-roles-table", debouncedSearch, page, limit],
    queryFn: () => getUsersTable(queryString),
    placeholderData: (prev) => prev,
  });

  const userIds = useMemo(
    () => (usersQuery.data?.data ?? []).map((u: any) => u.id),
    [usersQuery.data],
  );

  const assignmentsQuery = useQuery({
    queryKey: ["custom-role-assignments", userIds.join(",")],
    queryFn: () => getCustomRoleAssignments(userIds),
    enabled: userIds.length > 0,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ roleId, userId, checked }: { roleId: string; userId: string; checked: boolean }) =>
      checked ? assignCustomRole(roleId, userId) : unassignCustomRole(roleId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-role-assignments"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.customRoles.updateFailed")),
  });

  const userColumn = {
    id: "user",
    name: t("settings.admin.roles.user"),
    cell: (row: any) => (
      <div className="py-1">
        <div className="font-bold text-[#3C3C3C]">
          {row.name} {row.surname}
        </div>
        <div className="text-[12px] text-[#9a9a9a]">{row.email ?? row.username}</div>
      </div>
    ),
    grow: 2,
  };

  const roleColumns = (rolesQuery.data ?? []).map((role) => ({
    id: role.id,
    name: (
      <button
        type="button"
        onClick={() => setModalTarget(role)}
        className="flex items-center gap-1.5 cursor-pointer hover:text-[#2B9AE9]"
        title={t("common.edit")}
      >
        <span>{role.name}</span>
        <FontAwesomeIcon icon={faPen} className="text-[10px] opacity-60" />
      </button>
    ),
    center: true,
    width: "130px",
    cell: (row: any) => {
      const assigned = (assignmentsQuery.data?.[row.id] ?? []).includes(role.id);
      return (
        <Checkbox
          id={`custom-role-${role.id}-${row.id}`}
          checked={assigned}
          disabled={toggleMutation.isPending || assignmentsQuery.isLoading}
          onClick={(e) => e.stopPropagation()}
          handleChange={(checked: boolean) =>
            toggleMutation.mutate({ roleId: role.id, userId: row.id, checked })
          }
        />
      );
    },
  }));

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardHeader text={t("settings.admin.customRoles.title")} icon={faUserShield} />
          <p className="text-[14px] text-[#7a7a7a] mt-2">{t("settings.admin.customRoles.help")}</p>
        </div>
        <ButtonPrimary
          icon={faPlus}
          text={t("settings.admin.customRoles.createTitle")}
          onClick={() => setModalTarget("create")}
        />
      </div>

      <div className="mt-4">
        <Search
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchValue(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-[400px]"
        />
      </div>

      <div className="mt-4">
        <MainTable
          columns={[userColumn, ...roleColumns]}
          data={usersQuery.data?.data ?? []}
          paginationServer
          paginationTotalRows={usersQuery.data?.total ?? 0}
          onChangePage={setPage}
          onChangeRowsPerPage={(newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          }}
          progressPending={usersQuery.isFetching}
        />
      </div>

      {modalTarget !== null && (
        <CustomRoleModal
          key={modalTarget === "create" ? "create" : modalTarget.id}
          target={modalTarget}
          catalog={catalog}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
};

/* ─────────────────────────── Page ──────────────────────────────── */

const CustomRoles = () => {
  const permissionsQuery = usePermissions();
  const canManageRoles = hasPermission(
    "admin.roleAssignment.manage",
    permissionsQuery.data,
  );

  const catalogQuery = useQuery({
    queryKey: ["permission-catalog"],
    queryFn: getPermissionCatalog,
    enabled: canManageRoles,
  });

  if (!canManageRoles) return null;
  if (catalogQuery.isLoading || !catalogQuery.data) return null;

  return <CustomRolesSection catalog={catalogQuery.data} />;
};

export default CustomRoles;
