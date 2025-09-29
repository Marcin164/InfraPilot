import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./Pages/Main";
import Dashboards from "./Pages/Main/Dashboards";
import Users from "./Pages/Main/Users";
import Devices from "./Pages/Main/Devices";
import Flows from "./Pages/Main/Flows";
import Settings from "./Pages/Main/Settings";
import UserDetails from "./Pages/Main/Users/Details";
import DeviceDetails from "./Pages/Main/Devices/Details";
import SystemInfo from "./Pages/Main/Devices/Details/SystemInfo";
import Hardware from "./Pages/Main/Devices/Details/Hardware";
import Software from "./Pages/Main/Devices/Details/Software";
import Network from "./Pages/Main/Devices/Details/Network";
import Security from "./Pages/Main/Devices/Details/Security";
import Events from "./Pages/Main/Devices/Details/Events";
import History from "./Pages/Main/Devices/Details/History";
import Applications from "./Pages/Main/Applications";
import ApplicationsDetails from "./Pages/Main/Applications/Details";
import FlowsDetails from "./Pages/Main/Flows/Details";
import { ParseProvider } from "./Hooks/useParser";

function App() {
  return (
    <ParseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />}>
            <Route path="/dashboards" element={<Dashboards />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/:id" element={<DeviceDetails />}>
              <Route path="system" element={<SystemInfo />} />
              <Route path="hardware" element={<Hardware />} />
              <Route path="software" element={<Software />} />
              <Route path="network" element={<Network />} />
              <Route path="security" element={<Security />} />
              <Route path="events" element={<Events />} />
              <Route path="history" element={<History />} />
            </Route>
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationsDetails />} />
            <Route path="/flows" element={<Flows />} />
            <Route path="/flows/:id" element={<FlowsDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ParseProvider>
  );
}

export default App;
