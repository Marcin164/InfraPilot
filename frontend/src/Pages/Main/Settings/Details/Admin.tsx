import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import {
  faPlus,
  faTrash,
  faUsers,
  faPen,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import { getUserSettings, updateUserSettings } from "../../../../Services/settings";
import {
  AssignmentGroup,
  createAssignmentGroup,
  deleteAssignmentGroup,
  getAssignmentGroups,
  setAssignmentGroupMembers,
  updateAssignmentGroup,
} from "../../../../Services/assignmentGroups";
import { getUsers } from "../../../../Services/users";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import Modal from "../../../../Components/Modals/AnimatedModal";
import ColorPicker from "../../../../Components/Inputs/ColorPicker";
import type { LastLogonThreshold, User } from "../../../../Types";
import CustomRoles from "./CustomRoles";

const DEFAULT_THRESHOLDS: LastLogonThreshold[] = [
  { maxDays: 7, color: "#30A712", label: "Recent" },
  { maxDays: 30, color: "#F1C40F", label: "Warning" },
  { maxDays: 90, color: "#F3606E", label: "Inactive" },
];

/* ───────────────────── Last Logon Section ───────────────────── */

const LastLogonSection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const [thresholds, setThresholds] = useState<LastLogonThreshold[]>(DEFAULT_THRESHOLDS);
  const [defaultColor, setDefaultColor] = useState("#8A8A8A");

  useEffect(() => {
    if (settingsQuery.data) {
      setThresholds(settingsQuery.data.lastLogonThresholds ?? DEFAULT_THRESHOLDS);
      setDefaultColor(settingsQuery.data.lastLogonDefaultColor ?? "#8A8A8A");
    }
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (data: {
      lastLogonThresholds: LastLogonThreshold[];
      lastLogonDefaultColor: string;
    }) => updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      toast.success(t("toast.success.settingsSaved"));
    },
    onError: () => toast.error(t("toast.error.settingsSave")),
  });

  // Native <input type="color"> steals focus to the OS picker the moment it
  // opens (before the user has actually picked anything), so a blur-driven
  // autosave was saving the *old* color and never firing again once a new
  // one was chosen. Local-state-only edits + one explicit Save button avoids
  // depending on blur timing for any of these fields.
  const isDirty =
    JSON.stringify([...thresholds].sort((a, b) => a.maxDays - b.maxDays)) !==
      JSON.stringify(settingsQuery.data?.lastLogonThresholds ?? DEFAULT_THRESHOLDS) ||
    defaultColor !== (settingsQuery.data?.lastLogonDefaultColor ?? "#8A8A8A");

  const handleSave = () => {
    const sorted = [...thresholds].sort((a, b) => a.maxDays - b.maxDays);
    setThresholds(sorted);
    mutation.mutate({ lastLogonThresholds: sorted, lastLogonDefaultColor: defaultColor });
  };

  const updateThreshold = (idx: number, field: keyof LastLogonThreshold, value: string | number) => {
    setThresholds((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const removeThreshold = (idx: number) => setThresholds((prev) => prev.filter((_, i) => i !== idx));

  const addThreshold = () => {
    const maxExisting = thresholds.length ? Math.max(...thresholds.map((t) => t.maxDays)) : 0;
    setThresholds((prev) => [...prev, { maxDays: maxExisting + 30, color: "#535353", label: "New" }]);
  };

  const getDaysSinceText = (maxDays: number, idx: number) => {
    const prev = idx > 0 ? thresholds[idx - 1].maxDays : 0;
    return t("settings.admin.colors.range", { from: prev, to: maxDays });
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-6">
      <h2 className="text-[20px] font-bold text-[#3C3C3C] pb-1">{t("settings.admin.colors.title")}</h2>
      <p className="text-[14px] text-[#535353] pb-4">
        {t("settings.admin.colors.help")}
      </p>

      <div className="space-y-2">
        {thresholds.map((threshold, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
          >
            <ColorPicker
              value={threshold.color}
              onChange={(c) => updateThreshold(idx, "color", c)}
              size={36}
            />

            <input
              type="text"
              value={threshold.label}
              onChange={(e) => updateThreshold(idx, "label", e.target.value)}
              className="h-[36px] w-[120px] rounded-[8px] border border-[#535353] px-2 text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              placeholder={t("settings.admin.colors.label")}
            />

            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#535353]">{t("settings.admin.colors.within")}</span>
              <input
                type="number"
                min={1}
                value={threshold.maxDays}
                onChange={(e) => updateThreshold(idx, "maxDays", parseInt(e.target.value) || 1)}
                className="h-[36px] w-[70px] rounded-[8px] border border-[#535353] px-2 text-center text-[14px] font-bold text-[#3C3C3C] outline-none focus:border-[#2B9AE9]"
              />
              <span className="text-[13px] text-[#535353]">{t("settings.admin.colors.days")}</span>
            </div>

            <span className="text-[12px] text-[#8A8A8A] ml-auto hidden sm:inline">
              {getDaysSinceText(threshold.maxDays, idx)}
            </span>

            <button
              type="button"
              onClick={() => removeThreshold(idx)}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] text-[14px] text-[#F3606E] hover:bg-[#FDE8EA] cursor-pointer"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addThreshold}
        className="mt-3 flex items-center gap-2 rounded-[10px] border border-dashed border-[#535353] px-4 py-2 text-[14px] font-bold text-[#535353] hover:bg-[#F0F0F0] cursor-pointer transition"
      >
        <FontAwesomeIcon icon={faPlus} />
        {t("settings.admin.colors.addThreshold")}
      </button>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-[14px] font-bold text-[#3C3C3C]">
          {t("settings.admin.colors.defaultLabel")}
        </span>
        <ColorPicker
          value={defaultColor}
          onChange={setDefaultColor}
          size={36}
        />
        <span className="text-[13px] text-[#8A8A8A]">
          {t("settings.admin.colors.defaultRange", { days: thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0 })}
        </span>
      </div>

      <div className="mt-6">
        <ButtonPrimary
          icon={faCheck}
          text={mutation.isPending ? t("common.saving") : t("common.save")}
          onClick={handleSave}
          disabled={mutation.isPending || !isDirty}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-[16px] font-bold text-[#3C3C3C] pb-2">{t("settings.admin.colors.preview")}</h3>
        <div className="flex flex-wrap gap-2">
          {thresholds.map((t, idx) => (
            <div
              key={idx}
              className="rounded-[10px] px-4 py-2 text-center text-[13px] font-bold text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.label} ({getDaysSinceText(t.maxDays, idx)})
            </div>
          ))}
          <div
            className="rounded-[10px] px-4 py-2 text-center text-[13px] font-bold text-white"
            style={{ backgroundColor: defaultColor }}
          >
            {t("settings.admin.colors.default")} ({t("settings.admin.colors.defaultRange", { days: thresholds.length ? thresholds[thresholds.length - 1].maxDays : 0 })})
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Assignment Groups Section ────────────────── */

type AssignmentGroupModalTarget = "create" | AssignmentGroup | null;

const AssignmentGroupModal = ({
  target,
  userOptions,
  onClose,
}: {
  target: AssignmentGroupModalTarget;
  userOptions: { value: string; label: string }[];
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const editingGroup = target === "create" || target === null ? null : target;

  const [name, setName] = useState(editingGroup?.name ?? "");
  const [description, setDescription] = useState(editingGroup?.description ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(
    (editingGroup?.members ?? []).map((m) => m.id),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the draft only when the target group identity changes (not on
  // every field), so a background refetch mid-edit doesn't clobber unsaved
  // input -- same reasoning as CustomRoleModal.
  useEffect(() => {
    setName(editingGroup?.name ?? "");
    setDescription(editingGroup?.description ?? "");
    setMemberIds((editingGroup?.members ?? []).map((m) => m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingGroup?.id]);

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: ["assignment-groups"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const group = await createAssignmentGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (memberIds.length) await setAssignmentGroupMembers(group.id, memberIds);
      return group;
    },
    onSuccess: () => {
      toast.success(t("toast.success.assignmentGroupCreated"));
      invalidateGroups();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.createGroupFailed")),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await updateAssignmentGroup(editingGroup!.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      await setAssignmentGroupMembers(editingGroup!.id, memberIds);
    },
    onSuccess: () => {
      toast.success(t("toast.success.groupUpdated"));
      invalidateGroups();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.updateGroupFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAssignmentGroup(editingGroup!.id),
    onSuccess: () => {
      toast.success(t("toast.success.groupDeleted"));
      invalidateGroups();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.admin.groups.deleteGroupFailed")),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    if (editingGroup) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedMembers = userOptions.filter((o) => memberIds.includes(o.value));

  return (
    <>
      <Modal
        classNames={{ modal: "w-[620px] max-w-full max-h-[85vh] overflow-y-auto rounded-[10px]" }}
        open={target !== null}
        onClose={onClose}
        center
      >
        <CardHeader
          text={
            editingGroup
              ? t("settings.assignmentGroups.editTitle", { name: editingGroup.name })
              : t("settings.assignmentGroups.create")
          }
          icon={faUsers}
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
          <SelectSecondary
            label="Members"
            options={userOptions}
            value={selectedMembers}
            isMulti
            isClearable={false}
            onSelect={(opts: any) => setMemberIds((opts ?? []).map((o: any) => o.value))}
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            {editingGroup && (
              <ButtonPrimary
                icon={faTrash}
                text={t("common.delete")}
                onClick={() => setConfirmDelete(true)}
                disabled={deleteMutation.isPending}
                color="red"
              />
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
          editingGroup
            ? t("settings.admin.groups.deleteConfirm", { name: editingGroup.name })
            : undefined
        }
      />
    </>
  );
};

const AssignmentGroupsSection = () => {
  const { t } = useTranslation();
  const [modalTarget, setModalTarget] = useState<AssignmentGroupModalTarget>(null);

  const permissionsQuery = usePermissions();

  const canManageGroups = hasPermission(
    "helpdesk.assignmentGroups.manage",
    permissionsQuery.data,
  );

  const groupsQuery = useQuery({
    queryKey: ["assignment-groups"],
    queryFn: getAssignmentGroups,
  });

  const usersQuery = useQuery({
    queryKey: ["users-all"],
    queryFn: getUsers,
  });

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? []).map((u: User) => ({
        value: u.id,
        label: `${u.name} ${u.surname}${u.email ? ` (${u.email})` : ""}`,
      })),
    [usersQuery.data],
  );

  if (permissionsQuery.isLoading || groupsQuery.isLoading) {
    return (
      <div className="bg-white shadow-xl rounded-[10px] p-4">{t("common.loading2")}</div>
    );
  }

  return (
    <>
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardHeader text={t("settings.assignmentGroups.title")} icon={faUsers} />
          {canManageGroups && (
            <ButtonPrimary
              icon={faPlus}
              text={t("settings.assignmentGroups.create")}
              onClick={() => setModalTarget("create")}
            />
          )}
        </div>

        {!canManageGroups && (
          <p className="text-[14px] text-[#7a7a7a] mt-2">
            Read-only view. Only administrators can manage assignment groups.
          </p>
        )}

        <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {(groupsQuery.data ?? []).length === 0 && (
            <div className="text-[14px] text-[#7a7a7a]">No assignment groups yet.</div>
          )}

          {(groupsQuery.data ?? []).map((group) => (
            <div
              key={group.id}
              className={twMerge(
                "border border-[#E6E6E6] rounded-[10px] p-4",
                canManageGroups && "cursor-pointer hover:border-[#2B9AE9]",
              )}
              onClick={canManageGroups ? () => setModalTarget(group) : undefined}
            >
              <div className="text-[16px] font-semibold text-[#3C3C3C] flex items-center gap-1.5">
                {group.name}
                {canManageGroups && (
                  <FontAwesomeIcon icon={faPen} className="text-[10px] opacity-60" />
                )}
              </div>
              {group.description && (
                <div className="text-[14px] text-[#7a7a7a]">{group.description}</div>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                {(group.members ?? []).length === 0 && (
                  <span className="text-[13px] text-[#9a9a9a]">No members</span>
                )}
                {(group.members ?? []).map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 bg-[#F0F7FE] text-[#2B9AE9] text-[13px] font-medium rounded-full px-3 py-1"
                  >
                    <FontAwesomeIcon icon={faUsers} />
                    {m.name} {m.surname}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalTarget !== null && (
        <AssignmentGroupModal
          key={modalTarget === "create" ? "create" : modalTarget.id}
          target={modalTarget}
          userOptions={userOptions}
          onClose={() => setModalTarget(null)}
        />
      )}
    </>
  );
};

/* ──────────────────────── Admin Page ────────────────────────── */

const Admin = () => {
  const permissionsQuery = usePermissions();
  if (!hasPermission("admin.roleAssignment.manage", permissionsQuery.data)) return null;

  return (
    <div className="space-y-4 m-4">
      <LastLogonSection />
      <CustomRoles />
      <AssignmentGroupsSection />
    </div>
  );
};

export default Admin;
