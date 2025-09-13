import React from "react";

type Props = {
  name: string;
  value: any;
};

const Parameter = ({ name, value }: Props) => {
  return (
    <div>
      <span className="capitalize text-[#3C3C3C] font-light">
        {name.replace(/_/g, " ")}:{" "}
      </span>
      <span className="text-[#3C3C3C] font-semibold ">{value}</span>
    </div>
  );
};

export default Parameter;
