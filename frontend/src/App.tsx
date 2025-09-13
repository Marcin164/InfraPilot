import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./Pages/Main";
import Dashboards from "./Pages/Main/Dashboards";
import Users from "./Pages/Main/Users";
import Devices from "./Pages/Main/Devices";
import Flows from "./Pages/Main/Flows";
import Storage from "./Pages/Main/Storage";
import Settings from "./Pages/Main/Settings";
import UserDetails from "./Pages/Main/Users/Details";
import DeviceDetails from "./Pages/Main/Devices/Details";
import SystemInfo from "./Pages/Main/Devices/Details/SystemInfo";
import Hardware from "./Pages/Main/Devices/Details/Hardware";
import Software from "./Pages/Main/Devices/Details/Software";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />}>
          <Route path="/dashboards" element={<Dashboards />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:id" element={<DeviceDetails />}>
            <Route path="systeminfo" element={<SystemInfo />} />
            <Route path="hardware" element={<Hardware />} />
            <Route path="software" element={<Software />} />
          </Route>
          <Route path="/flows" element={<Flows />} />
          <Route path="/storage" element={<Storage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
