import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { getMyTickets } from "../../../Services/tickets";
import type { Ticket } from "../../../Types";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import { twMerge } from "tailwind-merge";

const stateColor: Record<string, string> = {
  New: "bg-[#2B9AE9] text-white",
  Assigned: "bg-[#2B9AE9] text-white",
  "In progress": "bg-[#F1C40F] text-[#3C3C3C]",
  "Awaiting for user": "bg-[#F3606E] text-white",
  "Awaiting for vendor": "bg-[#8A8A8A] text-white",
  Resolved: "bg-[#30A712] text-white",
  Closed: "bg-[#535353] text-white",
  Cancelled: "bg-[#BC0E0E] text-white",
};

const priorityColor: Record<string, string> = {
  Low: "text-[#30A712]",
  Medium: "text-[#2B9AE9]",
  High: "text-[#F1C40F]",
  Critical: "text-[#BC0E0E]",
};

const TicketRow = ({ ticket, showUpdate }: { ticket: Ticket; showUpdate: boolean }) => {
  const updatedAt = (ticket as any).updatedAt ?? ticket.createdAt;
  return (
    <Link
      to={`/user/tickets/${ticket.id}`}
      className="flex items-center justify-between rounded-[10px] bg-white p-4 shadow-xl transition hover:shadow-2xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={twMerge(
            "shrink-0 rounded-full px-3 py-[2px] text-[11px] font-bold uppercase",
            stateColor[ticket.state] ?? "bg-[#E0E0E0] text-[#3C3C3C]",
          )}
        >
          {ticket.state}
        </span>
        <span className="text-[14px] font-bold text-[#3C3C3C]">
          {ticket.type} {ticket.number}
        </span>
        <span
          className={twMerge(
            "text-[13px] font-semibold",
            priorityColor[ticket.priority] ?? "",
          )}
        >
          {ticket.priority}
        </span>
        <span className="truncate text-[13px] text-[#535353]">
          {ticket.description}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-[12px] text-[#8A8A8A]">
        <span>Created {moment(ticket.createdAt).format("DD MMM YYYY")}</span>
        {showUpdate && (
          <span>
            Last update{" "}
            <span className="font-semibold text-[#3C3C3C]">
              {moment(updatedAt).fromNow()}
            </span>
          </span>
        )}
      </div>
    </Link>
  );
};

const Section = ({
  title,
  tickets,
  isLoading,
  showUpdate,
  emptyText,
}: {
  title: string;
  tickets: Ticket[];
  isLoading: boolean;
  showUpdate: boolean;
  emptyText: string;
}) => (
  <div>
    <h2 className="pb-2 text-[18px] font-bold text-[#3C3C3C]">
      {title}{" "}
      <span className="text-[14px] font-semibold text-[#8A8A8A]">
        ({tickets.length})
      </span>
    </h2>
    {isLoading && (
      <div className="rounded-[10px] bg-white p-4 text-[#8A8A8A] shadow-xl">
        Loading…
      </div>
    )}
    {!isLoading && tickets.length === 0 && (
      <div className="rounded-[10px] bg-white p-4 text-[#8A8A8A] shadow-xl">
        {emptyText}
      </div>
    )}
    {!isLoading && tickets.length > 0 && (
      <div className="flex flex-col gap-2">
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} showUpdate={showUpdate} />
        ))}
      </div>
    )}
  </div>
);

const Tickets = () => {
  const [tab, setTab] = useState<"open" | "closed">("open");

  const openQuery = useQuery({
    queryKey: ["my-tickets", "open"],
    queryFn: () => getMyTickets("open"),
  });

  const closedQuery = useQuery({
    queryKey: ["my-tickets", "closed"],
    queryFn: () => getMyTickets("closed"),
    enabled: tab === "closed",
  });

  return (
    <PageMotion>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("open")}
              className={twMerge(
                "cursor-pointer rounded-[10px] px-5 py-2 text-[14px] font-bold transition",
                tab === "open"
                  ? "bg-[#2B9AE9] text-white shadow-md"
                  : "border border-[#E0E0E0] bg-white text-[#535353] hover:border-[#B5D9F5]",
              )}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setTab("closed")}
              className={twMerge(
                "cursor-pointer rounded-[10px] px-5 py-2 text-[14px] font-bold transition",
                tab === "closed"
                  ? "bg-[#2B9AE9] text-white shadow-md"
                  : "border border-[#E0E0E0] bg-white text-[#535353] hover:border-[#B5D9F5]",
              )}
            >
              Closed
            </button>
          </div>
          <Link to="/user/tickets/new">
            <ButtonPrimary icon={faPlus} text="New ticket" color="blue" />
          </Link>
        </div>

        {tab === "open" && (
          <Section
            title="Open tickets"
            tickets={openQuery.data ?? []}
            isLoading={openQuery.isLoading}
            showUpdate
            emptyText="You have no open tickets."
          />
        )}
        {tab === "closed" && (
          <Section
            title="Closed tickets"
            tickets={closedQuery.data ?? []}
            isLoading={closedQuery.isLoading}
            showUpdate={false}
            emptyText="You have no closed tickets."
          />
        )}
      </div>
    </PageMotion>
  );
};

export default Tickets;
