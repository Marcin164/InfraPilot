import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faWindows } from "@fortawesome/free-brands-svg-icons";

type Props = {};

const AD = (props: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Active Directory" icon={faWindows} />
    </div>
  );
};

export default AD;
