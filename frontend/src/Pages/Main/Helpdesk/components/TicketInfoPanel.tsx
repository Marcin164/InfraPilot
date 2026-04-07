import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faDesktop, faUser } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router";
import moment from "moment";
import UpdateTicketForm from "../../../../Components/Forms/UpdateTicketForm";

interface TicketInfoPanelProps {
  ticket: {
    type: string;
    number: string;
    requester: { id: string; distinguishedName: string };
    device?: { id: string; assetName?: string; serialNumber: string } | null;
    createdAt: string;
    [key: string]: any;
  };
}

const TicketInfoPanel = ({ ticket }: TicketInfoPanelProps) => {
  return (
    <div className="w-[500px] h-fit bg-white shadow-xl rounded-[10px] p-4 my-4 ml-4">
      <CardHeader text={`${ticket.type} ${ticket.number}`} />

      <div className="py-1">
        <FontAwesomeIcon icon={faUser} className="w-[20px]" />
        <span className="ml-2 font-semibold">
          <Link to={`/users/${ticket.requester.id}`}>
            {ticket.requester.distinguishedName}
          </Link>
        </span>
      </div>

      <div className="py-1">
        <FontAwesomeIcon icon={faDesktop} className="w-[20px]" />
        <span className="ml-2 font-semibold">
          {ticket.device ? (
            <Link to={`/devices/${ticket.device.id}`}>
              {ticket.device.assetName || ticket.device.serialNumber}
            </Link>
          ) : (
            "N/A"
          )}
        </span>
      </div>

      <div className="py-1">
        <FontAwesomeIcon icon={faClock} className="w-[20px]" />
        <span className="ml-2 font-semibold">
          {moment(ticket.createdAt).format("MM/DD/YYYY, HH:mm")}
        </span>
      </div>

      <UpdateTicketForm {...ticket} />
    </div>
  );
};

export default TicketInfoPanel;
