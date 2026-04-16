import RGL, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import BitlockerCompliance from "./components/BitlockerCompliance";
import DashboardTopbar from "../../../Components/Topbar/DashboardTopbar";
import LastScan from "./components/LastScan";
import ActiveUsers from "./components/ActiveUsers";
import ActiveDevices from "./components/ActiveDevices";
import TotalUsers from "./components/TotalUsers";
import TotalDevices from "./components/TotalDevices";
import OpenTickets from "./components/OpenTickets";
import OnlineDevices from "./components/OnlineDevices";
import DevicesByOS from "./components/DevicesByOS";
import TicketsByPriority from "./components/TicketsByPriority";
import UsersByDepartment from "./components/UsersByDepartment";
import TicketsOverTime from "./components/TicketsOverTime";
import DevicesByManufacturer from "./components/DevicesByManufacturer";
import TicketsByState from "./components/TicketsByState";
import SecurityCompliance from "./components/SecurityCompliance";
import TopApplications from "./components/TopApplications";
import { useQuery } from "@tanstack/react-query";
import { getDashboards } from "../../../Services/dashboards";
import type { Dashboard } from "../../../Types";
import { useCallback, useEffect, useRef, useState } from "react";
import DataLoader from "../../../Components/Loaders/DataLoader";
import { DASHBOARD_WIDGETS } from "../../../Constants/dashboardWidgets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import PageMotion from "../../../Components/PageMotion/PageMotion";
import { DashboardDataProvider } from "./DashboardDataContext";

const ReactGridLayout = WidthProvider(RGL);

const componentMap: any = {
  BitlockerCompliance,
  ActiveUsers,
  ActiveDevices,
  LastScan,
  TotalUsers,
  TotalDevices,
  OpenTickets,
  OnlineDevices,
  DevicesByOS,
  TicketsByPriority,
  UsersByDepartment,
  TicketsOverTime,
  DevicesByManufacturer,
  TicketsByState,
  SecurityCompliance,
  TopApplications,
};

const Index = () => {
  const dashboardsQuery = useQuery({
    queryKey: ["dashboards"],
    queryFn: () => getDashboards(),
  });
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(
    dashboardsQuery.isSuccess ? dashboardsQuery?.data[0] : null
  );
  const [layout, setLayout] = useState<any[]>([]);
  const [draggingItem, setDraggingItem] = useState({
    i: "__dropping__",
    w: 3,
    h: 2,
  });

  const pendingWidgetRef = useRef<string | null>(null);

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

  const handleWidgetDragStart = useCallback((widgetId: string) => {
    pendingWidgetRef.current = widgetId;
    const widget = DASHBOARD_WIDGETS.find((w) => w.id === widgetId);
    if (widget) {
      setDraggingItem({ i: "__dropping__", w: widget.w, h: widget.h });
    }
  }, []);

  const syncLayoutItem = useCallback((newLayout: any[]) => {
    setLayout((prev) => {
      return prev.map((card) => {
        const updated = newLayout.find((item) => item.i === card.i);
        if (!updated) return card;
        if (card.x === updated.x && card.y === updated.y && card.w === updated.w && card.h === updated.h) return card;
        return { ...card, x: updated.x, y: updated.y, w: updated.w, h: updated.h };
      });
    });
  }, []);

  if (dashboardsQuery.isLoading) return <DataLoader />;
  if (!dashboardsQuery.isSuccess) return null;

  const getDashboardsSelectValues = () => {
    return dashboardsQuery.data.map((dashboard: Dashboard) => ({
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
      (dashboard: Dashboard) => dashboard.id === selectedDashboard.value
    );
    setCurrentDashboard(dashboard ?? null);
  };

  const onDrop = (_layout: any[], item: any, e: any) => {
    const widgetId = e.dataTransfer.getData("widgetId");
    if (!widgetId) return;

    const widget = DASHBOARD_WIDGETS.find((w) => w.id === widgetId);
    if (!widget) return;

    pendingWidgetRef.current = null;

    const newCard = {
      i: crypto.randomUUID(),
      x: item.x,
      y: item.y,
      w: widget.w,
      h: widget.h,
      minW: widget.minW,
      minH: widget.minH,
      maxW: widget.maxW,
      maxH: widget.maxH,
      component: widget.component,
    };

    setLayout((prev) => [...prev, newCard]);
  };

  const removeWidget = (id: string) => {
    setLayout((prev) => prev.filter((item) => item.i !== id));
  };

  return (
    <PageMotion>
    <DashboardDataProvider>
    <div className="w-[calc(100vw-240px)] px-4">
      <DashboardTopbar
        selectOptions={getDashboardsSelectValues()}
        selectDashboard={handleSetCurrentDashobard}
        currentDashboard={currentDashboard}
        onWidgetDragStart={handleWidgetDragStart}
      />
      <div className="h-[calc(100vh-160px)] overflow-y-auto p-2">
        <ReactGridLayout
          layout={layout}
          cols={12}
          rowHeight={50}
          isDroppable
          droppingItem={draggingItem}
          onDrop={onDrop}
          onDragStop={syncLayoutItem}
          onResizeStop={syncLayoutItem}
          compactType={null}
          preventCollision
          isBounded
          isResizable
          className="bg-[#E6E6E6] rounded-[10px] min-h-[calc(100vh-180px)]"
        >
          {layout.map((card) => {
            const Component = componentMap[card.component];
            if (!Component) return null;

            return (
              <div
                key={card.i}
                className="relative bg-white rounded-[10px] shadow group overflow-hidden"
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
    </DashboardDataProvider>
    </PageMotion>
  );
};

export default Index;
