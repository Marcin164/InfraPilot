import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {};

const UserForms = (props: Props) => {
  return (
    <div>
      <div className="text-[30px] font-semibold text-[#3C3C3C] pt-2">Forms</div>
      <div className="flex flex-wrap">
        <div className="w-[100px]">
          <div className="bg-[#2B9AE9] text-[#FFFFFF] w-[100px] h-[100px] rounded-full flex justify-center items-center text-[50px]">
            <FontAwesomeIcon icon={faFile} />
          </div>
          <div className="text-[14px] font-bold break-all py-4 text-center">
            Nowakowski_Marcin_ERF.docx
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForms;
