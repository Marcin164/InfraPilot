import { faMouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {
  serialNumber: string;
  type: string;
  model: string;
  location: string;
};

const PeripheralItem = ({ serialNumber, type, model, location }: Props) => {
  return (
    <div className="py-1 flex justify-between">
      <span>
        <FontAwesomeIcon icon={faMouse} className="pr-2 text-[#535353]" />
        <span className="text-[#535353]">{`${model}, ${serialNumber}`}</span>
      </span>
      <span className="bg-[#2B9AE9] px-2 py-1 text-[#FFFFFF] rounded-[10px] font-bold">
        {location}
      </span>
    </div>
  );
};

export default PeripheralItem;
