import React from "react";
import Parameter from "../Lists/Parameter";
import Partitions from "./Partitions";

type Props = { disks: any };

const Disks = ({ disks }: Props) => {
  return (
    <div className="w-fit bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">Disks</div>
      {disks.map((disk: any) => (
        <div className="inline-block mr-4">
          <div className="underline">Disk</div>
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
