import { DASHBOARD_WIDGETS } from "../../Constants/dashboardWidgets";

type Props = {
  isModalOpen: boolean;
};

const EditDashboardModal = ({ isModalOpen }: Props) => {
  if (!isModalOpen) return null;

  const onDragStart = (e: React.DragEvent, widgetId: string) => {
    e.dataTransfer.setData("widgetId", widgetId);
  };

  return (
    <div className="absolute w-[250px] shadow-xl rounded-[10px] px-4 pt-4 pb-2 bg-white top-[120px] right-4 z-[100] ">
      {DASHBOARD_WIDGETS.map((widget) => (
        <button
          key={widget.id}
          draggable
          onDragStart={(e) => onDragStart(e, widget.id)}
          className="w-full border border-dashed py-2 mb-2 rounded"
        >
          {widget.label}
        </button>
      ))}
    </div>
  );
};

export default EditDashboardModal;
