import React from "react";

type Props = {
  name: string;
  value: any;
};

const Parameter = ({ name, value }: Props) => {
  return (
    <div className="overflow-hidden text-ellipsis">
      <span className="capitalize text-[#3C3C3C] font-light">
        {name.replace(/_/g, " ")}:{" "}
      </span>
      <span className="text-[#3C3C3C] font-semibold">
        {!value || value === "" ? "N/A" : value}
      </span>
    </div>
  );
};

export default Parameter;
