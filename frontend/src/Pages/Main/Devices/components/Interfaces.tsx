import React from "react";
import CardHeader from "../../../../Components/Headers/CardHeader";
import { faEthernet } from "@fortawesome/free-solid-svg-icons";

type Props = { interfaces: any };

const Interfaces = ({ interfaces }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Interfaces" icon={faEthernet} />
    </div>
  );
};

export default Interfaces;
