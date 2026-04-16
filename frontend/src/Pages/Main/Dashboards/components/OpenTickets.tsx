import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import { getReports } from "../../../../Services/reports";
import { formatNumber } from "../helpers";

const OPEN_STATES = ["new", "assigned", "in progress", "awaiting for user", "awaiting for vendor"];

const OpenTickets = () => {
  const { data } = useQuery({
    queryKey: ["report", "tickets-by-state"],
    queryFn: () => getReports("tickets-by-state"),
  });

  const open = (data ?? [])
    .filter((d) => OPEN_STATES.includes(d.label.toLowerCase()))
    .reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full w-full items-center gap-4 px-5">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[#FDEBD0]">
        <FontAwesomeIcon icon={faTicket} className="text-[24px] text-[#E67E22]" />
      </div>
      <div className="min-w-0">
        <div className="text-[36px] font-extrabold leading-none text-[#3C3C3C]">
          {formatNumber(open)}
        </div>
        <div className="text-[13px] font-semibold text-[#8A8A8A]">Open Tickets</div>
      </div>
    </div>
  );
};

export default OpenTickets;
