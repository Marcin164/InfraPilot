import RGL, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import BitlockerCompliance from "../../../Components/Widgets/BitlockerCompliance";
import DashboardTopbar from "../../../Components/Topbar/DashboardTopbar";
import LastScan from "../../../Components/Widgets/LastScan";
import ActiveUsers from "../../../Components/Widgets/ActiveUsers";
import { useQuery } from "@tanstack/react-query";
import { getDashboards } from "../../../Services/dashboards";
import { useEffect, useState } from "react";
import DataLoader from "../../../Components/Loaders/DataLoader";
import { DASHBOARD_WIDGETS } from "../../../Constants/dashboardWidgets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import ActiveDevices from "../../../Components/Widgets/ActiveDevices";

const ReactGridLayout = WidthProvider(RGL);

const componentMap: any = {
  BitlockerCompliance,
  ActiveUsers,
  ActiveDevices,
  LastScan,
};

const Index = () => {
  const dashboardsQuery = useQuery({
    queryKey: ["dashboards"],
    queryFn: () => getDashboards(),
  });
  const [currentDashboard, setCurrentDashboard] = useState(
    dashboardsQuery.isSuccess ? dashboardsQuery?.data[0] : null
  );
  const [layout, setLayout] = useState<any[]>([]);
  const [draggingItem, setDraggingItem] = useState<any>({
    i: "__dropping__",
    w: 3,
    h: 2,
  });

  useEffect(() => {
    if (
      dashboardsQuery.isSuccess &&
      dashboardsQuery.data.length > 0 &&
      !currentDashboard
    ) {
      setCurrentDashboard(dashboardsQuery.data[0]);
    }
  }, [dashboardsQuery.isSuccess, dashboardsQuery.data]);

  useEffect(() => {
    if (currentDashboard?.cards) {
      setLayout(currentDashboard.cards);
    }
  }, [currentDashboard]);

  if (dashboardsQuery.isLoading) return <DataLoader />;
  if (!dashboardsQuery.isSuccess) return null;

  const getDashboardsSelectValues = () => {
    return dashboardsQuery.data.map((dashboard: any) => ({
      value: dashboard.id,
      label: dashboard.name,
    }));
  };

  const handleSetCurrentDashobard = (selectedDashboard: any) => {
    if (selectedDashboard?.id) {
      setCurrentDashboard(selectedDashboard);
      return;
    }

    const dashboard = dashboardsQuery.data.find(
      (dashboard: any) => dashboard.id === selectedDashboard.value
    );
    setCurrentDashboard(dashboard);
  };

  const onDrop = (_layout: any[], item: any, e: any) => {
    const widgetId = e.dataTransfer.getData("widgetId");
    if (!widgetId) return;

    const widget = DASHBOARD_WIDGETS.find((w) => w.id === widgetId);
    if (!widget) return;

    const preview = {
      i: "__dropping__",
      x: item.x,
      y: item.y,
      w: widget.w,
      h: widget.h,
    };

    setDraggingItem(preview);

    setLayout((prev) => [
      ...prev,
      {
        i: crypto.randomUUID(),
        x: item.x,
        y: item.y,
        w: widget.w,
        h: widget.h,
        minW: widget.minW,
        minH: widget.minH,
        component: widget.component,
      },
    ]);
  };

  const removeWidget = (id: string) => {
    setLayout((prev) => prev.filter((item) => item.i !== id));
  };

  const droppingItem = {
    i: "__dropping__",
    w: 3,
    h: 2,
  };

  return (
    <div className="w-[calc(100vw-240px)] px-4">
      <DashboardTopbar
        selectOptions={getDashboardsSelectValues()}
        selectDashboard={handleSetCurrentDashobard}
        currentDashboard={currentDashboard}
      />
      <div className="h-[calc(100vh-160px)] overflow-y-auto p-2">
        <ReactGridLayout
          layout={layout}
          cols={12}
          rowHeight={50}
          isDroppable
          droppingItem={draggingItem}
          onDrop={onDrop}
          compactType={null}
          preventCollision
          isBounded
          isResizable={false}
          className="bg-[#E6E6E6] rounded-[10px] min-h-[calc(100vh-180px)]"
        >
          {layout.map((card) => {
            const Component = componentMap[card.component];
            if (!Component) return null;

            return (
              <div
                key={card.i}
                className="relative bg-white rounded shadow group"
              >
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => removeWidget(card.i)}
                  className="absolute top-2 right-2 z-[90] hidden group-hover:flex bg-red-500 text-white rounded-full w-6 h-6 items-center justify-center text-sm cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
                <Component />
              </div>
            );
          })}
        </ReactGridLayout>
      </div>
    </div>
  );
};

export default Index;
