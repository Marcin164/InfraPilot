import React from "react";

type Props = {
  active: any;
  payload: any;
  label: any;
};

const CustomTooltip = ({ active, payload, label }: Props) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-white shadow-lg rounded-lg p-3 border text-sm">
      <div className="font-semibold">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
};

export default CustomTooltip;
