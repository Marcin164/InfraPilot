import React from "react";
import Parameter from "../../../../Components/Lists/Parameter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKeyboard } from "@fortawesome/free-solid-svg-icons";
import CardHeader from "../../../../Components/Headers/CardHeader";

type Props = { keyboards: any };

const Keyboards = ({ keyboards }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Keyboards" icon={faKeyboard} />
      {keyboards.map((keyboard: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {keyboard.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {keyboard.manufacturer || "Manufacturer not available"}
          </div>
          <Parameter name="Function keys" value={keyboard.function_keys} />
          <Parameter name="Device ID" value={keyboard.pnp_device_id} />
          <Parameter name="Operational status" value={keyboard.status} />
          <Parameter name="Layout" value={keyboard.layout} />
        </div>
      ))}
    </div>
  );
};

export default Keyboards;
