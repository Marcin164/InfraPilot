import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {};

const Search = (props: Props) => {
  return (
    <div className="w-fit shadow-xl rounded-[10px] flex ">
      <input
        type="text"
        placeholder="Search..."
        className="w-[310px] h-[50px] pl-4 bg-[#FFFFFF] outline-none rounded-l-[10px] text-[20px] text-[#3C3C3C]"
      />
      <div className="bg-[#FFFFFF] h-[50px] w-[50px] flex items-center justify-center rounded-r-[10px]">
        <FontAwesomeIcon icon={faSearch} />
      </div>
    </div>
  );
};

export default Search;
