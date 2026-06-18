import React from "react";

type Props = {
  name: string;
  value?: string | number | null;
};

const Parameter: React.FC<Props> = ({ name, value }) => {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[13px]">
      <span className="capitalize text-[#7a7a7a] font-light shrink-0">
        {name.replace(/_/g, " ")}
      </span>
      <span className="text-[#3C3C3C] font-semibold text-right truncate">
        {value ?? "N/A"}
      </span>
    </div>
  );
};

export default Parameter;
