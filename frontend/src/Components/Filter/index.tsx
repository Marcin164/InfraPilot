import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {};

const Filter = (icon: Props) => {
  return (
    <button className="w-[50px] h-[50px] bg-[#FFFFFF] outline-none shadow-xl rounded-[10px] text-[20px] text-[#3C3C3C]">
      <FontAwesomeIcon icon={faFilter} />
    </button>
  );
};

export default Filter;
