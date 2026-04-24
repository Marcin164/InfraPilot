import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      toast.error(err?.response?.data?.message ?? "Update failed"),
  });

  const pickUp = () => {
    if (!myId) {
      toast.error("Current user not resolved");
      return;
    }
    patch.mutate(
      {
        assignee: myId,
        state: ticket.state === "New" ? "In progress" : ticket.state,
      },
      {
        onSuccess: () => toast.success(`Picked up as ${myName}`),
      },
    );
  };

  const sendToUser = () =>
    patch.mutate(
      { state: "Awaiting for user" },
      {
        onSuccess: () =>
          toast.success("Awaiting user — SLA clock should pause"),
      },
    );

  const resolve = () => {
    const code = window.prompt(
      "Closure code (e.g. fixed, duplicate, wont-fix):",
      "fixed",
    );
    if (!code) return;
    const notes = window.prompt("Closure notes (optional):", "") ?? "";
    patch.mutate(
      {
        state: "Resolved",
        closureCode: code,
        closureNotes: notes,
      },
      {
        onSuccess: () => toast.success("Ticket resolved"),
      },
    );
  };

  const reopen = () =>
    patch.mutate(
      { state: "In progress", closureCode: null, closureNotes: null },
      {
        onSuccess: () => toast.success("Reopened"),
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
            ? "Already assigned to you"
            : "Assign to me and move to In progress"
        }
      >
        <FontAwesomeIcon icon={faHandRock} />
        {isMine ? "Mine" : "Pick up"}
      </button>

      {!isTerminal && !isAwaiting && (
        <button
          type="button"
          className={BTN}
          onClick={sendToUser}
          disabled={patch.isPending}
          title="Set state to Awaiting for user"
        >
          <FontAwesomeIcon icon={faHourglassHalf} />
          Await user
        </button>
      )}

      {!isTerminal && (
        <button
          type="button"
          className={BTN}
          onClick={resolve}
          disabled={patch.isPending}
          title="Prompt for closure code + resolve"
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          Resolve
        </button>
      )}

      {isTerminal && (
        <button
          type="button"
          className={BTN}
          onClick={reopen}
          disabled={patch.isPending}
          title="Reopen and clear closure"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
          Reopen
        </button>
      )}
    </div>
  );
};

export default QuickActions;
