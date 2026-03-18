import React from "react";

type Props = {
  label: string;
  value: string;
};

const Stat = ({ label, value }: Props) => {
  return (
    <div className="w-full backdrop-blur rounded-xl p-4 border border-[#F6F6F6] shadow-xl">
      <div className="text-slate-400 text-sm truncate">{label}</div>
      <div className="text-xl text-[#535353] font-semibold truncate">
        {value}
      </div>
    </div>
  );
};

export default Stat;
