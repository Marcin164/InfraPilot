import { faComputer, faLaptop, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import ButtonPrimary from "../Buttons/ButtonPrimary";

type Props = {};

const Equipment = (props: Props) => {
  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">Equipment</div>
      <div className="h-[calc(100%-100px)]">
        <div className="py-2 font-bold">Main Computer</div>
        <div className="py-1">
          <FontAwesomeIcon icon={faLaptop} className="pr-2 text-[#535353]" />
          <span className="uppercase text-[#2B9AE9]">HELPDESK</span>
          <span className="text-[#535353]"> - Dell Latitude 5440, U57HFV3</span>
        </div>
        <div className="py-2 font-bold">Computers with user signed in</div>
        <div className="py-1">
          <FontAwesomeIcon icon={faLaptop} className="pr-2 text-[#535353]" />
          <span className="uppercase text-[#2B9AE9]">HELPDESK</span>
          <span className="text-[#535353]"> - Dell Latitude 5440, U57HFV3</span>
        </div>
        <div className="py-1">
          <FontAwesomeIcon icon={faLaptop} className="pr-2 text-[#535353]" />
          <span className="uppercase text-[#2B9AE9]">HELPDESK</span>
          <span className="text-[#535353]"> - Dell Latitude 5440, U57HFV3</span>
        </div>
        <div className="py-2 font-bold">Other computers assigned to user</div>
        <span className="py-1">None</span>
        <div className="py-2 font-bold">Peripherals</div>
        <div className="py-1 flex justify-between">
          <span>
            <FontAwesomeIcon icon={faLaptop} className="pr-2 text-[#535353]" />
            <span className="text-[#535353]">DELL MOUSE MS116, GHROC84</span>
          </span>
          <span className="bg-[#2B9AE9] px-2 py-1 text-[#FFFFFF] rounded-[10px] font-bold">
            Office
          </span>
        </div>
      </div>
      <div>
        <ButtonPrimary icon={faPen} text="Edit equipment" onClick={() => {}} />
      </div>
    </div>
  );
};

export default Equipment;
