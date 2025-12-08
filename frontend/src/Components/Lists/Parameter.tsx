import React from "react";

type Props = {
  name: string;
  value?: string | number | null;
};

const Parameter: React.FC<Props> = ({ name, value }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap text-ellipsis">
      <span className="capitalize text-gray-800 font-light">
        {name.replace(/_/g, " ")}:{" "}
      </span>
      <span className="text-gray-800 font-semibold">{value ?? "N/A"}</span>
    </div>
  );
};

export default Parameter;
