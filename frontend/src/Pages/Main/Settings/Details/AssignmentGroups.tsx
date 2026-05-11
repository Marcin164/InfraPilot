import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { toast } from "react-toastify";
import {
  faPlus,
  faTrash,
  faUsers,
  faPen,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";

import {
  AssignmentGroup,
  createAssignmentGroup,
  deleteAssignmentGroup,
  getAssignmentGroups,
  setAssignmentGroupMembers,
  updateAssignmentGroup,
} from "../../../../Services/assignmentGroups";
import { getUser, getUsers } from "../../../../Services/users";
import type { User } from "../../../../Types";

const AssignmentGroups = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const authInfo: any = useAuthInfo();
  const currentUserId = authInfo?.user?.metadata?.id;

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const currentUserQuery = useQuery({
    queryKey: ["current-user", currentUserId],
    queryFn: () => getUser(currentUserId),
    enabled: Boolean(currentUserId),
  });

  const isAdmin = Boolean(currentUserQuery.data?.isAdmin);

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

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: ["assignment-groups"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createAssignmentGroup({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t("toast.success.assignmentGroupCreated"));
      setNewName("");
      setNewDescription("");
      invalidateGroups();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("toast.error.assignmentGroupCreate", "Failed to create group"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      description,
    }: {
      id: string;
      name?: string;
      description?: string;
    }) => updateAssignmentGroup(id, { name, description }),
    onSuccess: () => {
      toast.success(t("toast.success.groupUpdated"));
      setEditingId(null);
      invalidateGroups();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("toast.error.groupUpdate", "Failed to update group"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssignmentGroup(id),
    onSuccess: () => {
      toast.success(t("toast.success.groupDeleted"));
      invalidateGroups();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("toast.error.groupDelete", "Failed to delete group"));
    },
  });

  const setMembersMutation = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      setAssignmentGroupMembers(id, userIds),
    onSuccess: () => {
      toast.success(t("toast.success.membersUpdated"));
      invalidateGroups();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? t("toast.error.membersUpdate", "Failed to update members"));
    },
  });

  const startEdit = (group: AssignmentGroup) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditDescription(group.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    createMutation.mutate();
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error(t("toast.error.nameRequired"));
      return;
    }
    updateMutation.mutate({
      id,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
  };

  const handleMembersChange = (groupId: string, options: any) => {
    const userIds = (options ?? []).map((o: any) => o.value);
    setMembersMutation.mutate({ id: groupId, userIds });
  };

  if (currentUserQuery.isLoading || groupsQuery.isLoading) {
    return (
      <div className="bg-white shadow-xl rounded-[10px] p-4 m-4">
        {t("common.loading2")}
      </div>
    );
  }

  return (
    <div className="space-y-4 m-4">
      {isAdmin && (
        <div className="bg-white shadow-xl rounded-[10px] p-4">
          <CardHeader text={t("settings.assignmentGroups.create")} icon={faPlus} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("form.name")}
              value={newName}
              onChange={(e: any) => setNewName(e.target.value)}
            />
            <Input
              label={t("common.description")}
              value={newDescription}
              onChange={(e: any) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <ButtonPrimary
              icon={faPlus}
              text={t("common.create")}
              onClick={handleCreate}
              disabled={createMutation.isPending}
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.assignmentGroups.title")} icon={faUsers} />

        {!isAdmin && (
          <p className="text-[14px] text-[#7a7a7a] mt-2">
            {t("settings.assignmentGroups.readonlyHelp", "Read-only view. Only administrators can manage assignment groups.")}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {(groupsQuery.data ?? []).length === 0 && (
            <div className="text-[14px] text-[#7a7a7a]">
              {t("settings.assignmentGroups.empty", "No assignment groups yet.")}
            </div>
          )}

          {(groupsQuery.data ?? []).map((group) => {
            const memberValues = (group.members ?? []).map((m) => ({
              value: m.id,
              label: `${m.name} ${m.surname}${m.email ? ` (${m.email})` : ""}`,
            }));

            const isEditing = editingId === group.id;

            return (
              <div
                key={group.id}
                className="border border-[#E6E6E6] rounded-[10px] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label={t("form.name")}
                          value={editName}
                          onChange={(e: any) => setEditName(e.target.value)}
                        />
                        <Input
                          label={t("common.description")}
                          value={editDescription}
                          onChange={(e: any) =>
                            setEditDescription(e.target.value)
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-[18px] font-semibold text-[#3C3C3C]">
                          {group.name}
                        </div>
                        {group.description && (
                          <div className="text-[14px] text-[#7a7a7a]">
                            {group.description}
                          </div>
                        )}
                        <div className="text-[12px] text-[#9a9a9a] mt-1">
                          {(group.members ?? []).length} member
                          {(group.members ?? []).length === 1 ? "" : "s"}
                        </div>
                      </>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <ButtonPrimary
                            icon={faCheck}
                            text={t("common.save")}
                            onClick={() => handleSaveEdit(group.id)}
                            disabled={updateMutation.isPending}
                          />
                          <ButtonPrimary
                            icon={faXmark}
                            text={t("common.cancel")}
                            onClick={cancelEdit}
                          />
                        </>
                      ) : (
                        <>
                          <ButtonPrimary
                            icon={faPen}
                            text={t("common.edit")}
                            onClick={() => startEdit(group)}
                          />
                          <ButtonPrimary
                            icon={faTrash}
                            text={t("common.delete")}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete assignment group "${group.name}"?`,
                                )
                              ) {
                                deleteMutation.mutate(group.id);
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {isAdmin ? (
                    <SelectSecondary
                      label={t("settings.assignmentGroups.members", "Members")}
                      options={userOptions}
                      value={memberValues}
                      isMulti
                      isClearable={false}
                      onSelect={(opts: any) =>
                        handleMembersChange(group.id, opts)
                      }
                    />
                  ) : (
                    <div>
                      <div className="font-bold text-[#3C3C3C] mb-1">
                        {t("settings.assignmentGroups.members", "Members")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(group.members ?? []).length === 0 && (
                          <span className="text-[14px] text-[#9a9a9a]">
                            {t("settings.assignmentGroups.noMembers", "No members")}
                          </span>
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssignmentGroups;
