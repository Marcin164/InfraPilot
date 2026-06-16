import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPaste, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import ConfirmationModal from "../../../../Components/Modals/ConfirmationModal";
import {
  listTicketTemplates,
  createTicketTemplate,
  updateTicketTemplate,
  deleteTicketTemplate,
  TicketTemplate,
} from "../../../../Services/ticketTemplates";

const emptyDraft = () => ({
  name: "",
  body: "",
  category: "general",
  shared: true,
});

const TicketTemplates = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft());
  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message?: string }>({ open: false, onConfirm: () => {} });
  const askConfirm = (onConfirm: () => void, message?: string) => setConfirmState({ open: true, onConfirm, message });

  const templatesQuery = useQuery({
    queryKey: ["ticket-templates"],
    queryFn: listTicketTemplates,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ticket-templates"] });

  const createMutation = useMutation({
    mutationFn: () => createTicketTemplate(draft),
    onSuccess: () => {
      toast.success(t("toast.success.templateCreated"));
      setDraft(emptyDraft());
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.templates.createFailed")),
  });

  const toggleSharedMutation = useMutation({
    mutationFn: (tpl: TicketTemplate) =>
      updateTicketTemplate(tpl.id, { shared: !tpl.shared }),
    onSuccess: () => invalidate(),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.templates.updateFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicketTemplate(id),
    onSuccess: () => {
      toast.success(t("toast.success.templateDeleted"));
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.templates.deleteFailed")),
  });

  const templates = templatesQuery.data ?? [];

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.templates.new")} icon={faPlus} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          {t("settings.templates.help")}{" "}
          <code>{"{requester.firstName}"}</code>,{" "}
          <code>{"{requester.fullName}"}</code>,{" "}
          <code>{"{device.assetName}"}</code>,{" "}
          <code>{"{device.serialNumber}"}</code>,{" "}
          <code>{"{ticket.number}"}</code>, <code>{"{ticket.type}"}</code>.
        </p>
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
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder={t("settings.templates.bodyPlaceholder")}
          rows={5}
          className="mt-2 w-full rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
        />
        <div className="mt-3 flex items-center gap-3">
          <Checkbox
            id="template-shared"
            checked={draft.shared}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDraft({ ...draft, shared: e.target.checked })
            }
            label={t("settings.templates.shared")}
          />
          <ButtonPrimary
            icon={faPlus}
            text={createMutation.isPending ? t("settings.templates.saving") : t("common.create")}
            onClick={() => {
              if (!draft.name.trim() || !draft.body.trim()) {
                toast.error(t("toast.error.bodyRequired"));
                return;
              }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("settings.templates.existing")} icon={faPaste} />
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
                  onClick={() => askConfirm(() => deleteMutation.mutate(tpl.id), t("settings.templates.confirmDelete", { name: tpl.name }))}
                  className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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

export default TicketTemplates;
