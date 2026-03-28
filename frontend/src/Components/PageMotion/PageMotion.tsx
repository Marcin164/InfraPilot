import React from "react";
import { motion } from "framer-motion";

type Props = {
  children: any;
};

const PageMotion = ({ children }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default PageMotion;
