import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {};

const NoData = (props: Props) => {
  return (
    <div className="w-fit h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-16 mt-[100px] mx-auto text-center">
      <FontAwesomeIcon className="text-[100px] text-[#3C3C3C]" icon={faFile} />
      <div className="text-[40px] text-[#3C3C3C] font-bold pt-8">
        No data available
      </div>
    </div>
  );
};

export default NoData;
