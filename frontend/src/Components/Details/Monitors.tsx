import { faDesktop } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import Parameter from "../Lists/Parameter";

type Props = { screens: any };

const Monitors = ({ screens }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#3C3C3C]">
        <FontAwesomeIcon className="mr-2" icon={faDesktop} />
        <span>Screens</span>
      </div>
      {screens.map((screen: any) => (
        <div>
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {screen.name}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {screen.manufacturer || "Manufacturer not available"}
          </div>
          <Parameter
            name="Dimensions"
            value={`${screen.screen_width} x ${screen.screen_height}`}
          />
          <Parameter name="Device ID" value={screen.pnp_device_id} />
          <Parameter name="Operational status" value={screen.status} />
        </div>
      ))}
    </div>
  );
};

export default Monitors;
