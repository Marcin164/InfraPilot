import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./Pages/Main";
import Dashboards from "./Pages/Main/Dashboards";
import Users from "./Pages/Main/Users";
import Devices from "./Pages/Main/Devices";
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
import Helpdesk from "./Pages/Main/Helpdesk";
import { ParseProvider } from "./Hooks/useParser";
import UsersInfo from "./Pages/Main/Devices/Details/UsersInfo";
import Peripherals from "./Pages/Main/Devices/Details/Peripherals";
import EditEquipment from "./Pages/Main/Users/EditEquipment";
import HelpdeskDetails from "./Pages/Main/Helpdesk/Details";

function App() {
  return (
    <ParseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />}>
            <Route path="/dashboards" element={<Dashboards />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/users/:id/edit" element={<EditEquipment />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/:id" element={<DeviceDetails />}>
              <Route path="system" element={<SystemInfo />} />
              <Route path="hardware" element={<Hardware />} />
              <Route path="software" element={<Software />} />
              <Route path="network" element={<Network />} />
              <Route path="security" element={<Security />} />
              <Route path="events" element={<Events />} />
              <Route path="users" element={<UsersInfo />} />
              <Route path="peripherals" element={<Peripherals />} />
              <Route path="history" element={<History />} />
            </Route>
            <Route path="/helpdesk" element={<Helpdesk />} />
            <Route path="/helpdesk/:id" element={<HelpdeskDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ParseProvider>
  );
}

export default App;
