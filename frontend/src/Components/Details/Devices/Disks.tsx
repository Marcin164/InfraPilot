import React from "react";
import Parameter from "../../Lists/Parameter";
import Partitions from "../Partitions";
import CardHeader from "../../Headers/CardHeader";

type Props = { disks: any };

const Disks = ({ disks }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <CardHeader text="Disks" />
      {disks.map((disk: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {disk.model}
          </div>
          <div className="text-[14px] font-light text-[#3C3C3C] mb-2">
            {disk.serial_number}
          </div>
          {disk.partitions.map((partition: any) => (
            <Partitions {...partition} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Disks;
