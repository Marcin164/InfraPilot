import React from "react";

type Props = {
  title: any;
  subtitle: any;
};

const SectionTitle = ({ title, subtitle }: Props) => {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
    </div>
  );
};

export default SectionTitle;
