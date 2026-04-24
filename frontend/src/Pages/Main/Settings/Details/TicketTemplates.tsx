import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faPaste, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
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
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyDraft());

  const templatesQuery = useQuery({
    queryKey: ["ticket-templates"],
    queryFn: listTicketTemplates,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ticket-templates"] });

  const createMutation = useMutation({
    mutationFn: () => createTicketTemplate(draft),
    onSuccess: () => {
      toast.success("Template created");
      setDraft(emptyDraft());
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Create failed"),
  });

  const toggleSharedMutation = useMutation({
    mutationFn: (tpl: TicketTemplate) =>
      updateTicketTemplate(tpl.id, { shared: !tpl.shared }),
    onSuccess: () => invalidate(),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTicketTemplate(id),
    onSuccess: () => {
      toast.success("Template deleted");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Delete failed"),
  });

  const templates = templatesQuery.data ?? [];

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="New template" icon={faPlus} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          Placeholders resolved at paste time:{" "}
          <code>{"{requester.firstName}"}</code>,{" "}
          <code>{"{requester.fullName}"}</code>,{" "}
          <code>{"{device.assetName}"}</code>,{" "}
          <code>{"{device.serialNumber}"}</code>,{" "}
          <code>{"{ticket.number}"}</code>, <code>{"{ticket.type}"}</code>.
        </p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Name (e.g. Ask for screenshot)"
            className="md:col-span-2 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
          <input
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="Category"
            className="h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px]"
          />
        </div>
        <textarea
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder="Hi {requester.firstName}, could you please…"
          rows={5}
          className="mt-2 w-full rounded-[6px] border border-[#D0D0D0] px-3 py-2 text-[13px]"
        />
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={draft.shared}
              onChange={(e) =>
                setDraft({ ...draft, shared: e.target.checked })
              }
            />
            Shared with team
          </label>
          <ButtonPrimary
            icon={faPlus}
            text={createMutation.isPending ? "Saving…" : "Create"}
            onClick={() => {
              if (!draft.name.trim() || !draft.body.trim()) {
                toast.error("Name and body are required");
                return;
              }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          />
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Existing templates" icon={faPaste} />
        {templates.length === 0 ? (
          <div className="mt-3 text-[13px] text-[#7a7a7a]">
            No templates yet.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-3 rounded-[8px] border border-[#E0E0E0] px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#3C3C3C]">
                      {t.name}
                    </span>
                    <span className="text-[11px] text-[#9a9a9a]">
                      {t.category}
                    </span>
                    {!t.shared && (
                      <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-[#FFF0D8] text-[#C07C0F]">
                        private
                      </span>
                    )}
                  </div>
                  <pre className="text-[12px] text-[#535353] mt-1 whitespace-pre-wrap break-words">
                    {t.body}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSharedMutation.mutate(t)}
                  className="text-[12px] text-[#2B9AE9] hover:underline cursor-pointer"
                >
                  {t.shared ? "make private" : "share"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${t.name}"?`))
                      deleteMutation.mutate(t.id);
                  }}
                  className="text-[#F3606E] hover:text-[#C0392B] cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketTemplates;
