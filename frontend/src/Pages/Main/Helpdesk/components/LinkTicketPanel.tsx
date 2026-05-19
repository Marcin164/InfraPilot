import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { faLink, faLinkSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import { linkTicket } from "../../../../Services/tickets";

type Props = {
  ticket: any;
};

const LinkTicketPanel = ({ ticket }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const mutation = useMutation({
    mutationFn: (parentId: string | null) => linkTicket(ticket.id, parentId),
    onSuccess: () => {
      toast.success(t("toast.success.linked"));
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Link failed"),
  });

  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    mutation.mutate(v);
  };

  return (
    <div className="mt-4 rounded-[8px] border border-[#E0E0E0] p-3">
      <div className="flex items-center gap-2 mb-2">
        <FontAwesomeIcon icon={faLink} className="text-[#2B9AE9]" />
        <span className="text-[13px] font-bold text-[#3C3C3C]">
          Linked tickets
        </span>
      </div>

      {ticket.parent && (
        <div className="text-[12px] mb-2">
          Duplicate of:{" "}
          <Link
            to={`/admin/helpdesk/${ticket.parent.id}`}
            className="font-bold text-[#2B9AE9] hover:underline"
          >
            #{ticket.parent.number}
          </Link>{" "}
          <button
            type="button"
            onClick={() => mutation.mutate(null)}
            disabled={mutation.isPending}
            className="text-[11px] text-[#F3606E] hover:underline cursor-pointer ml-2"
          >
            <FontAwesomeIcon icon={faLinkSlash} /> unlink
          </button>
        </div>
      )}

      {Array.isArray(ticket.children) && ticket.children.length > 0 && (
        <div className="text-[12px] mb-2">
          <div className="text-[11px] font-bold text-[#9a9a9a] uppercase mb-1">
            Duplicates of this ({ticket.children.length})
          </div>
          {ticket.children.map((c: any) => (
            <Link
              key={c.id}
              to={`/admin/helpdesk/${c.id}`}
              className="block text-[#2B9AE9] hover:underline"
            >
              #{c.number} — {c.category ?? "—"}
            </Link>
          ))}
        </div>
      )}

      {!ticket.parent && (
        <div className="flex gap-2 items-end">
          <Input
            className="flex-1 pt-0"
            value={draft}
            handleChange={setDraft}
            placeholder={t("helpdesk.parentTicketUuid")}
          />
          <ButtonPrimary
            icon={faLink}
            onClick={submit}
            disabled={mutation.isPending || !draft.trim()}
            className="px-3 py-2 flex-shrink-0"
            title={t("helpdesk.linkAsDuplicate")}
          />
        </div>
      )}
    </div>
  );
};

export default LinkTicketPanel;
