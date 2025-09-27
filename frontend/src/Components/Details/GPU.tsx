import React from "react";
import Parameter from "../Lists/Parameter";

type Props = {
  gpus: any;
};

const GPU = ({ gpus }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4 overflow-hidden text-wrap wrap-break-word break-normal text-ellipsis">
      <div className="text-[30px] font-semibold text-[#3C3C3C]">GPU</div>
      {gpus.map((gpu: any, index: number) => (
        <div className="inline-block mr-4">
          <div className="text-[16px] font-semibold text-[#2B9AE9] pt-2">
            {`Card ${index}`}
          </div>
          {Object.entries(gpu).map(([key, value]: any) => (
            <Parameter name={key} value={value} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default GPU;
