import React from "react";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";

type Props = {};

const index = (props: Props) => {
  return (
    <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 m-4">
      <div className="pt-2 pb-4 text-[#3C3C3C] font-semibold">
        Active Directory
      </div>
      <div>
        <ButtonPrimary text="Connect to active directory" onClick={() => {}} />
      </div>
    </div>
  );
};

export default index;
