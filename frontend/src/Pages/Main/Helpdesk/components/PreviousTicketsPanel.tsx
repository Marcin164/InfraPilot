import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import moment from "moment";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getTicketsByRequester,
  getTicketsByDevice,
} from "../../../../Services/tickets";

const STATE_COLOR: Record<string, string> = {
  New: "#2B9AE9",
  Assigned: "#2B9AE9",
  "In progress": "#F1C40F",
  "Awaiting for user": "#F1C40F",
  "Awaiting for vendor": "#F1C40F",
  Resolved: "#30A712",
  Closed: "#8A8A8A",
  Cancelled: "#8A8A8A",
};

type Props = {
  ticketId: string;
  requesterId: string | null | undefined;
  deviceId: string | null | undefined;
};

const PreviousTicketsPanel = ({ ticketId, requesterId, deviceId }: Props) => {
  const requesterQuery = useQuery({
    queryKey: ["tickets-by-requester", requesterId],
    queryFn: () => getTicketsByRequester(requesterId!, 8),
    enabled: Boolean(requesterId),
  });

  const deviceQuery = useQuery({
    queryKey: ["tickets-by-device", deviceId],
    queryFn: () => getTicketsByDevice(deviceId!, 8),
    enabled: Boolean(deviceId),
  });

  const requesterOther = (requesterQuery.data ?? []).filter(
    (t: any) => t.id !== ticketId,
  );
  const deviceOther = (deviceQuery.data ?? []).filter(
    (t: any) => t.id !== ticketId,
  );

  if (
    !requesterQuery.isLoading &&
    !deviceQuery.isLoading &&
    requesterOther.length === 0 &&
    deviceOther.length === 0
  ) {
    return null;
  }

  const Row = ({ t }: { t: any }) => (
    <Link
      to={`/admin/helpdesk/${t.id}`}
      className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#F5F5F5] text-[12px]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-bold text-[#3C3C3C] shrink-0">#{t.number}</span>
        <span className="truncate text-[#535353]">{t.category ?? "—"}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: STATE_COLOR[t.state] ?? "#8A8A8A" }}
        >
          {t.state}
        </span>
        <span className="text-[10px] text-[#9a9a9a]">
          {moment(t.createdAt).fromNow()}
        </span>
      </div>
    </Link>
  );

  return (
    <div className="mt-4 rounded-[8px] border border-[#E0E0E0] p-3">
      <div className="flex items-center gap-2 mb-2">
        <FontAwesomeIcon icon={faLayerGroup} className="text-[#2B9AE9]" />
        <span className="text-[13px] font-bold text-[#3C3C3C]">
          Related history
        </span>
      </div>

      {requesterOther.length > 0 && (
        <div className="mb-2">
          <div className="text-[11px] font-bold text-[#9a9a9a] uppercase mb-1">
            From this requester ({requesterOther.length})
          </div>
          <div className="space-y-0.5">
            {requesterOther.map((t: any) => (
              <Row key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}

      {deviceOther.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-[#9a9a9a] uppercase mb-1">
            On this device ({deviceOther.length})
          </div>
          <div className="space-y-0.5">
            {deviceOther.map((t: any) => (
              <Row key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousTicketsPanel;
