import React from "react";

type Props = { avs: any };

const Antivirus = ({ avs }: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">AV's</div>
      {avs.map((av: any) => (
        <div className="pt-2">
          <div className="text-[#3C3C3C] text-[16px] font-bold">{`${av.displayName} (${av.productState})`}</div>
          <div className="text-[#3C3C3C] font-light">
            {av.pathToSignedProductExe}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Antivirus;
