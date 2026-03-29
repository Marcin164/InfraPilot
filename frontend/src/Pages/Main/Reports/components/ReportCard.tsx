import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import Stat from "./Stat";

type Props = {
  title: any;
  description: any;
  children: ReactNode;
  onExport: any;
  stats?: any;
};

const ReportCard = ({
  title,
  description,
  children,
  stats,
  onExport,
}: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-white rounded-2xl shadow-lg p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Export CSV
          </button>
        )}
      </div>

      <div className="w-full h-[420px]">{children}</div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {stats.map((s: any, i: number) => (
            <Stat key={i} label={s.label} value={s.value} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ReportCard;
