import React from "react";
import Parameter from "../Lists/Parameter";
import Partitions from "./Partitions";

type Props = { disks: any };

const Disks = ({ disks }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">Disks</div>
      {disks.map((disk: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {`Disks ${index}`}
          </div>
          {Object.entries(disk).map(
            ([key, value]) =>
              !Array.isArray(value) && <Parameter name={key} value={value} />
          )}
          {disk.partitions.map((partition: any) => (
            <Partitions {...partition} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Disks;
