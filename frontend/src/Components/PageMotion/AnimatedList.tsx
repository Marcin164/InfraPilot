import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

const container = (stagger: number) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger },
  },
});

export const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const AnimatedList = ({ children, className = "", stagger = 0.04 }: Props) => (
  <motion.div
    variants={container(stagger)}
    initial="hidden"
    animate="show"
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedList;
