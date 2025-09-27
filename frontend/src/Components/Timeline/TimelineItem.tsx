import { faMouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  date: any;
  ticket: string;
  devices: any;
  details: any;
  justification: any;
  approvers: any;
  owner: any;
};

const TimelineItem = ({
  date,
  ticket,
  devices,
  details,
  justification,
  approvers,
  owner,
}: Props) => {
  return (
    <div className="ml-[20px] pb-4">
      <div>
        <span className="text-[#535353] font-bold">{date}</span>
        <span className="text-[#2B9AE9] font-bold ml-2">{`Ticket ${ticket}`}</span>
      </div>
      {devices &&
        devices.length > 0 &&
        devices.map((device: any) => (
          <div className="py-1 flex justify-between">
            <span>
              <FontAwesomeIcon icon={faMouse} className="pr-2 text-[#535353]" />
              <span className="text-[#535353]">{`${device.model}, ${device.serialNumber}`}</span>
            </span>
            <span className="bg-[#2B9AE9] px-2 py-1 text-[#FFFFFF] rounded-[10px] font-bold">
              {device.location}
            </span>
          </div>
        ))}
      {owner && (
        <span className="text-[#3C3C3C] font-light italic">{owner}</span>
      )}
      {details && (
        <div className="py-1">
          <div className="text-[#535353] font-bold">Details</div>
          <span className="text-[#3C3C3C] font-light italic">{details}</span>
        </div>
      )}
      {justification && (
        <div className="py-1">
          <div className="text-[#535353] font-bold">Justification</div>
          <span className="text-[#3C3C3C] font-light italic">
            {justification}
          </span>
        </div>
      )}
      {approvers && (
        <div className="py-1">
          <div className="text-[#535353] font-bold">Approvers</div>
          <span className="text-[#3C3C3C] font-light italic">
            {approvers.map((approver: string, index: number) => (
              <>
                {approver} {index !== approvers.length - 1 && <>&bull;</>}
              </>
            ))}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineItem;
