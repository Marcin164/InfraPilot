import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPaste, faPlus, faTrash, faPen, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import Modal from "../../../../Components/Modals/AnimatedModal";
import {
  listTicketTemplates,
  createTicketTemplate,
  updateTicketTemplate,
  deleteTicketTemplate,
  TicketTemplate,
} from "../../../../Services/ticketTemplates";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

const emptyDraft = () => ({
  name: "",
  body: "",
  category: "general",
  shared: true,
});

// Must match the `context` shape TemplatePicker.tsx builds when a template
// is actually inserted into a ticket -- these are the only paths
// substituteTemplate() can resolve. Grouped for the picker UI.
const VARIABLE_GROUPS: { group: string; vars: { path: string; label: string }[] }[] = [
  {
    group: "Ticket",
    vars: [
      { path: "ticket.number", label: "Number" },
      { path: "ticket.type", label: "Type" },
      { path: "ticket.category", label: "Category" },
    ],
  },
  {
    group: "Requester",
    vars: [
      { path: "requester.firstName", label: "First name" },
      { path: "requester.lastName", label: "Last name" },
      { path: "requester.fullName", label: "Full name" },
      { path: "requester.email", label: "Email" },
    ],
  },
  {
    group: "Device",
    vars: [
      { path: "device.assetName", label: "Asset name" },
      { path: "device.serialNumber", label: "Serial number" },
      { path: "device.model", label: "Model" },
    ],
  },
];

type TemplateModalTarget = "create" | TicketTemplate | null;

const TemplateModal = ({
  target,
  onClose,
}: {
  target: TemplateModalTarget;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const editingTemplate = target === "create" || target === null ? null : target;
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [draft, setDraft] = useState(
    editingTemplate
      ? {
          name: editingTemplate.name,
          body: editingTemplate.body,
          category: editingTemplate.category,
          shared: editingTemplate.shared,
        }
      : emptyDraft(),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(
      editingTemplate
        ? {
            name: editingTemplate.name,
            body: editingTemplate.body,
            category: editingTemplate.category,
            shared: editingTemplate.shared,
          }
        : emptyDraft(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTemplate?.id]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ticket-templates"] });

  const insertVariable = (path: string) => {
    const placeholder = `{${path}}`;
    const el = bodyRef.current;
    const start = el?.selectionStart ?? draft.body.length;
    const end = el?.selectionEnd ?? draft.body.length;
    const nextBody = draft.body.slice(0, start) + placeholder + draft.body.slice(end);
    setDraft({ ...draft, body: nextBody });
    // Put the cursor right after the inserted placeholder, same as most
    // "insert dynamic value" pickers -- has to wait a tick for React to
    // apply the new value before the selection can be set.
    requestAnimationFrame(() => {
      el?.focus();
      const caret = start + placeholder.length;
      el?.setSelectionRange(caret, caret);
    });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      editingTemplate ? updateTicketTemplate(editingTemplate.id, draft) : createTicketTemplate(draft),
    onSuccess: () => {
      toast.success(editingTemplate ? t("toast.success.templateUpdated") : t("toast.success.templateCreated"));
      invalidate();
      onClose();
    },
    onError: (err: any) =>
      toast.error(
        err?.response?.data?.message ??
          (editingTemplate ? t("settings.templates.updateFailed") : t("settings.templates.createFailed")),
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicketTemplate(editingTemplate!.id),
    onSuccess: () => {
      toast.success(t("toast.success.templateDeleted"));
      invalidate();
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.templates.deleteFailed")),
  });

  const handleSave = () => {
    if (!draft.name.trim() || !draft.body.trim()) {
      toast.error(t("toast.error.bodyRequired"));
      return;
    }
    saveMutation.mutate();
  };

  return (
    <>
      <Modal
        classNames={{ modal: "w-[700px] max-w-full max-h-[85vh] overflow-y-auto rounded-[10px]" }}
        open={target !== null}
        onClose={onClose}
        center
      >
        <CardHeader
          text={
            editingTemplate
              ? t("settings.templates.editing", { name: editingTemplate.name })
              : t("settings.templates.new")
          }
          icon={editingTemplate ? faPen : faPlus}
        />
        <p className="text-[12px] text-[#7a7a7a] mt-2">{t("settings.templates.help")}</p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            value={draft.name}
            handleChange={(v: string) => setDraft({ ...draft, name: v })}
            placeholder={t("settings.templates.namePlaceholder")}
            className="md:col-span-2"
          />
          <Input
            value={draft.category}
            handleChange={(v: string) => setDraft({ ...draft, category: v })}
            placeholder={t("settings.templates.categoryPlaceholder")}
          />
        </div>
        <textarea
          ref={bodyRef}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder={t("settings.templates.bodyPlaceholder")}
          rows={5}
          className="mt-2 w-full rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {VARIABLE_GROUPS.map((g) => (
            <div key={g.group} className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase text-[#9a9a9a]">{g.group}:</span>
              {g.vars.map((v) => (
                <button
                  key={v.path}
                  type="button"
                  onClick={() => insertVariable(v.path)}
                  title={`{${v.path}}`}
                  className="rounded-[5px] border border-[#D8E9FA] bg-[#F0F8FE] px-2 py-0.5 text-[11px] font-semibold text-[#2B9AE9] hover:bg-[#E0F0FD] cursor-pointer"
                >
                  + {v.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Checkbox
            id="template-shared"
            checked={draft.shared}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraft({ ...draft, shared: e.target.checked })
            }
            label={t("settings.templates.shared")}
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            {editingTemplate && (
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
              text={saveMutation.isPending ? t("settings.templates.saving") : t("common.save")}
              onClick={handleSave}
              disabled={saveMutation.isPending}
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
          editingTemplate
            ? t("settings.templates.confirmDelete", { name: editingTemplate.name })
            : undefined
        }
      />
    </>
  );
};

const TicketTemplates = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [modalTarget, setModalTarget] = useState<TemplateModalTarget>(null);

  const templatesQuery = useQuery({
    queryKey: ["ticket-templates"],
    queryFn: listTicketTemplates,
  });

  const toggleSharedMutation = useMutation({
    mutationFn: (tpl: TicketTemplate) =>
      updateTicketTemplate(tpl.id, { shared: !tpl.shared }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket-templates"] }),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.templates.updateFailed")),
  });

  const templates = templatesQuery.data ?? [];

  const permissionsQuery = usePermissions();
  if (!hasPermission("helpdesk.ticketTemplates.manage", permissionsQuery.data)) return null;

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardHeader text={t("settings.templates.existing")} icon={faPaste} />
          <ButtonPrimary
            icon={faPlus}
            text={t("settings.templates.new")}
            onClick={() => setModalTarget("create")}
          />
        </div>

        {templates.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            {t("settings.templates.empty")}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-start gap-3 rounded-[8px] border border-[#E0E0E0] px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#3C3C3C]">
                      {tpl.name}
                    </span>
                    <span className="text-[11px] text-[#9a9a9a]">
                      {tpl.category}
                    </span>
                    {!tpl.shared && (
                      <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#FFF0D8] text-[#C07C0F]">
                        {t("settings.templates.private")}
                      </span>
                    )}
                  </div>
                  <pre className="text-[12px] text-[#535353] mt-1 whitespace-pre-wrap break-words">
                    {tpl.body}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSharedMutation.mutate(tpl)}
                  className="text-[12px] text-[#2B9AE9] hover:underline cursor-pointer"
                >
                  {tpl.shared ? t("settings.templates.makePrivate") : t("settings.templates.share")}
                </button>
                <button
                  type="button"
                  onClick={() => setModalTarget(tpl)}
                  className="text-[#2B9AE9] cursor-pointer"
                  title={t("common.edit")}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalTarget !== null && (
        <TemplateModal
          key={modalTarget === "create" ? "create" : modalTarget.id}
          target={modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
};

export default TicketTemplates;
