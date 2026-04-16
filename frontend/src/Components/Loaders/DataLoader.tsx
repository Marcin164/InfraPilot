import { motion } from "framer-motion";
import { RingLoader } from "react-spinners";

const DataLoader = () => {
  return (
    <motion.div
      className="w-full h-full flex flex-col justify-center items-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <RingLoader color="#2B9AE9" size={160} />
      </motion.div>
      <motion.div
        className="text-[#3C3C3C] font-bold pt-4 text-[30px]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Fetching data...
      </motion.div>
    </motion.div>
  );
};

export default DataLoader;
