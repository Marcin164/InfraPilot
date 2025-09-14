import React from "react";
import Parameter from "../Lists/Parameter";

type Props = { firewall: any };

const Firewall = ({ firewall }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">Firewall</div>
      <div className="py-2">
        <div className="underline">Domain</div>
        <div>
          {Object.entries(firewall.Domain).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      </div>
      <div className="py-2">
        <div className="underline">Private</div>
        <div>
          {Object.entries(firewall.Private).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      </div>
      <div className="py-2">
        <div className="underline">Public</div>
        <div>
          {Object.entries(firewall.Public).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Firewall;
