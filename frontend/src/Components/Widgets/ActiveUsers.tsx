import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {};

const InfoCard = (props: Props) => {
  return (
    <div className="bg-[#FFFFFF] h-full p-2 rounded-[10px]">
      <div className="w-[110px] h-full bg-[#D7EEFF] rounded-[10px] flex justify-center items-center">
        <FontAwesomeIcon
          icon={faUsers}
          className="text-[#2B9AE9] text-[40px]"
        />
      </div>
    </div>
  );
};

export default InfoCard;
