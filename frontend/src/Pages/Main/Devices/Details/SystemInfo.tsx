import React from "react";
import { useOutletContext } from "react-router";
import Parameter from "../../../../Components/Lists/Parameter";

type Props = {};

const SystemInfo = ({}: Props) => {
  const device: any = useOutletContext();
  if (!device?.data?.system) return null;

  const systemInfo = device.data.system;

  return (
    <div className="w-[600px] bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">
        System Info
      </div>
      {Object.entries(systemInfo).map(([key, value]: any) => (
        <Parameter name={key} value={value} />
      ))}
    </div>
  );
};

export default SystemInfo;
