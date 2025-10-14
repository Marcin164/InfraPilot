import React from "react";

type Props = { text: string };

const CardHeader = ({ text }: Props) => {
  return <div className="text-[30px] font-semibold text-[#3C3C3C]">{text}</div>;
};

export default CardHeader;
