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
import Reports from "./Pages/Main/Reports";
import { ParseProvider } from "./Hooks/useParser";
import UsersInfo from "./Pages/Main/Devices/Details/UsersInfo";
import Peripherals from "./Pages/Main/Devices/Details/Peripherals";
import EditEquipment from "./Pages/Main/Users/EditEquipment";
import HelpdeskDetails from "./Pages/Main/Helpdesk/Details";
import Sla from "./Pages/Main/Settings/Details/Sla";
import Personal from "./Pages/Main/Settings/Details/Personal";
import UsersReports from "./Pages/Main/Reports/Details/UsersReports";
import DevicesReports from "./Pages/Main/Reports/Details/DevicesReports";
import TicketsReports from "./Pages/Main/Reports/Details/TicketsReports";
import SecurityReports from "./Pages/Main/Reports/Details/SecurityReports";
import { AnimatePresence } from "framer-motion";
import { useAuthSetup } from "./Hooks/useAuthSetup";

function App() {
  useAuthSetup();

  return (
    <AnimatePresence mode="wait">
      <ParseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Main />}>
              <Route index path="/dashboards" element={<Dashboards />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserDetails />} />
              <Route
                path="/users/:id/equipmentedit"
                element={<EditEquipment />}
              />
              <Route path="/devices" element={<Devices />} />
              <Route path="/devices/:id" element={<DeviceDetails />}>
                <Route index path="system" element={<SystemInfo />} />
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
              <Route path="/reports" element={<Reports />}>
                <Route path="users" element={<UsersReports />} />
                <Route path="devices" element={<DevicesReports />} />
                <Route path="tickets" element={<TicketsReports />} />
                <Route path="security" element={<SecurityReports />} />
              </Route>
              <Route path="/settings" element={<Settings />}>
                <Route index path="personal" element={<Personal />} />
                <Route path="sla" element={<Sla />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ParseProvider>
    </AnimatePresence>
  );
}

export default App;
