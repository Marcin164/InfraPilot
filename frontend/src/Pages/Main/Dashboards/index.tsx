import RGL, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Compliance from "../../../Components/Dashboard/Compliance";
import DashboardTopbar from "../../../Components/Topbar/DashboardTopbar";
import TableCard from "../../../Components/Dashboard/TableCard";
import InfoCard from "../../../Components/Dashboard/InfoCard";
import { useQuery } from "@tanstack/react-query";
import { getDashboards } from "../../../Services/dashboards";
import { useAuthInfo } from "@propelauth/react";
import { useEffect, useState } from "react";
import DataLoader from "../../../Components/Loaders/DataLoader";

const ReactGridLayout = WidthProvider(RGL);

const componentMap: any = {
  Compliance,
  InfoCard,
  TableCard,
};

const Index = () => {
  const authInfo = useAuthInfo();
  const dashboardsQuery = useQuery({
    queryKey: ["dashboards"],
    queryFn: () => getDashboards(authInfo.accessToken),
  });
  const [currentDashboard, setCurrentDashboard] = useState(
    dashboardsQuery.isSuccess ? dashboardsQuery?.data[0] : null
  );

  useEffect(() => {
    if (
      dashboardsQuery.isSuccess &&
      dashboardsQuery.data.length > 0 &&
      !currentDashboard // tylko jeśli jeszcze nie ma ustawionego dashboardu
    ) {
      setCurrentDashboard(dashboardsQuery.data[0]);
    }
  }, [dashboardsQuery.isSuccess, dashboardsQuery.data]);

  if (dashboardsQuery.isLoading) return <DataLoader />;
  if (!dashboardsQuery.isSuccess) return null;

  const getDashboardsSelectValues = () => {
    return dashboardsQuery.data.map((dashboard: any) => ({
      value: dashboard.id,
      label: dashboard.name,
    }));
  };

  const handleSetCurrentDashobard = (selectedDashboard: any) => {
    // 1️⃣ jeśli dashboard pochodzi z AddDashboardModal (ma pole id)
    if (selectedDashboard?.id) {
      setCurrentDashboard(selectedDashboard);
      return;
    }

    // 2️⃣ jeśli dashboard pochodzi z Selecta (ma value)
    const dashboard = dashboardsQuery.data.find(
      (dashboard: any) => dashboard.id === selectedDashboard.value
    );
    setCurrentDashboard(dashboard);
  };

  return (
    <div className="w-[calc(100vw-240px)] px-4">
      <DashboardTopbar
        selectOptions={getDashboardsSelectValues()}
        selectDashboard={handleSetCurrentDashobard}
        currentDashboard={currentDashboard}
      />
      <ReactGridLayout
        className="layout"
        layout={currentDashboard?.cards}
        cols={12}
        rowHeight={50}
        width={1200}
        style={{ background: "#F6F6F6" }}
      >
        {currentDashboard?.cards &&
          currentDashboard.cards.length > 0 &&
          currentDashboard.cards.map((card: any) => {
            const Component: any = componentMap[card.component];
            if (!Component) return null;

            return (
              <div key={card.i}>
                <Component />
              </div>
            );
          })}
      </ReactGridLayout>
    </div>
  );
};

export default Index;
