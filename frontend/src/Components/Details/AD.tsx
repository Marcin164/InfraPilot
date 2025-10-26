import React from "react";
import CardHeader from "../Headers/CardHeader";

type Props = {};

const AD = (props: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Active Directory" />
    </div>
  );
};

export default AD;
