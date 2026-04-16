import { motion, AnimatePresence } from "framer-motion";
import { DASHBOARD_WIDGETS } from "../../Constants/dashboardWidgets";

type Props = {
  isModalOpen: boolean;
  onWidgetDragStart?: (widgetId: string) => void;
};

const widgetItem = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0 },
};

const EditDashboardModal = ({ isModalOpen, onWidgetDragStart }: Props) => {
  const onDragStart = (e: React.DragEvent, widgetId: string) => {
    e.dataTransfer.setData("widgetId", widgetId);
    onWidgetDragStart?.(widgetId);
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute w-[250px] shadow-xl rounded-[10px] px-4 pt-4 pb-2 bg-white top-[120px] right-4 z-[100] max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.03, delayChildren: 0.1 }}
          >
            {DASHBOARD_WIDGETS.map((widget) => (
              <motion.div key={widget.id} variants={widgetItem} transition={{ duration: 0.2 }}>
                <button
                  draggable
                  onDragStart={(e) => onDragStart(e, widget.id)}
                  className="w-full border border-dashed py-2 mb-2 rounded text-[13px] text-[#3C3C3C] hover:bg-[#F0F6FF] transition-colors"
                >
                  {widget.label}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditDashboardModal;
