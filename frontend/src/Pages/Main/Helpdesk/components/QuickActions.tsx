import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuthInfo } from "@propelauth/react";
import { toast } from "react-toastify";
import {
  faHandRock,
  faHourglassHalf,
  faCheckCircle,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { updateTicket } from "../../../../Services/tickets";

const BTN =
  "inline-flex items-center gap-1 rounded-[6px] border border-[#D0D0D0] bg-white px-2.5 py-1 text-[12px] font-bold text-[#3C3C3C] hover:bg-[#F5F5F5] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

type Props = {
  ticket: {
    id: string;
    state: string;
    assignee?: string | null;
  };
};

const TERMINAL_STATES = new Set(["Resolved", "Closed", "Cancelled"]);
const AWAITING_STATES = new Set(["Awaiting for user", "Awaiting for vendor"]);

const QuickActions = ({ ticket }: Props) => {
  const { t } = useTranslation();
  const { user }: any = useAuthInfo();
  const myId = user?.metadata?.id ?? user?.userId ?? null;
  const myName =
    [user?.metadata?.firstName, user?.metadata?.lastName]
      .filter(Boolean)
      .join(" ") || user?.email;

  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: (changes: Record<string, any>) =>
      updateTicket(ticket.id, changes as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      queryClient.invalidateQueries({ queryKey: ["helpdesk"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.lifecycle.updateFailed")),
  });

  const pickUp = () => {
    if (!myId) {
      toast.error(t("toast.error.userNotResolved"));
      return;
    }
    patch.mutate(
      {
        assignee: myId,
        state: ticket.state === "New" ? "In progress" : ticket.state,
      },
      {
        onSuccess: () => toast.success(t("helpdesk.pickedUp", { name: myName })),
      },
    );
  };

  const sendToUser = () =>
    patch.mutate(
      { state: "Awaiting for user" },
      {
        onSuccess: () =>
          toast.success(t("toast.success.slaPaused")),
      },
    );

  const resolve = () => {
    const code = window.prompt(
      t("helpdesk.prompt.closureCode"),
      "fixed",
    );
    if (!code) return;
    const notes = window.prompt(t("helpdesk.prompt.closureNotes"), "") ?? "";
    patch.mutate(
      {
        state: "Resolved",
        closureCode: code,
        closureNotes: notes,
      },
      {
        onSuccess: () => toast.success(t("toast.success.ticketResolved")),
      },
    );
  };

  const reopen = () =>
    patch.mutate(
      { state: "In progress", closureCode: null, closureNotes: null },
      {
        onSuccess: () => toast.success(t("toast.success.ticketReopened")),
      },
    );

  const isMine = myId && ticket.assignee === myId;
  const isTerminal = TERMINAL_STATES.has(ticket.state);
  const isAwaiting = AWAITING_STATES.has(ticket.state);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        className={BTN}
        onClick={pickUp}
        disabled={patch.isPending || (isMine && !isTerminal)}
        title={
          isMine
            ? t("helpdesk.action.alreadyAssigned")
            : t("helpdesk.action.pickupTitle")
        }
      >
        <FontAwesomeIcon icon={faHandRock} />
        {isMine ? t("helpdesk.action.mine") : t("helpdesk.action.pickup")}
      </button>

      {!isTerminal && !isAwaiting && (
        <button
          type="button"
          className={BTN}
          onClick={sendToUser}
          disabled={patch.isPending}
          title={t("helpdesk.action.awaitUserTitle")}
        >
          <FontAwesomeIcon icon={faHourglassHalf} />
          {t("helpdesk.action.awaitUser")}
        </button>
      )}

      {!isTerminal && (
        <button
          type="button"
          className={BTN}
          onClick={resolve}
          disabled={patch.isPending}
          title={t("helpdesk.action.resolveTitle")}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          {t("helpdesk.action.resolve")}
        </button>
      )}

      {isTerminal && (
        <button
          type="button"
          className={BTN}
          onClick={reopen}
          disabled={patch.isPending}
          title={t("helpdesk.action.reopenTitle")}
        >
          <FontAwesomeIcon icon={faRotateLeft} />
          {t("helpdesk.action.reopen")}
        </button>
      )}
    </div>
  );
};

export default QuickActions;
