import RGL, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Compliance from "../../../Components/Dashboard/Compliance";
import DashboardTopbar from "../../../Components/Topbar/DashboardTopbar";
import TableCard from "../../../Components/Dashboard/TableCard";
import InfoCard from "../../../Components/Dashboard/InfoCard";

const ReactGridLayout = WidthProvider(RGL);

const Index = () => {
  const layout = [
    { i: "1", x: 0, y: 0, w: 3, h: 5, minW: 3, maxW: 6, minH: 5, maxH: 8 },
    { i: "2", x: 0, y: 5, w: 6, h: 6, minW: 6, maxW: 6, minH: 4, maxH: 10 },
    { i: "3", x: 3, y: 0, w: 2, h: 2, minW: 2, maxW: 6, minH: 2, maxH: 8 },
  ];

  return (
    <div className="w-[calc(100vw-240px)] px-4">
      <DashboardTopbar />
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={50}
        width={1200}
        style={{ background: "#F6F6F6" }}
      >
        <div key="1">
          <Compliance />
        </div>
        <div key="2">
          <TableCard />
        </div>
        <div key="3">
          <InfoCard />
        </div>
      </ReactGridLayout>
    </div>
  );
};

export default Index;
