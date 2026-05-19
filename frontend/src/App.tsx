import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Compliance from "./Pages/Main/Devices/Details/Compliance";
import FleetHealth from "./Pages/Main/Fleet";
import Cves from "./Pages/Main/Devices/Details/Cves";
import Lifecycle from "./Pages/Main/Devices/Details/Lifecycle";
import Tasks from "./Pages/Main/Devices/Details/Tasks";
import Scans from "./Pages/Main/Devices/Details/Scans";
import Events from "./Pages/Main/Devices/Details/Events";
import DeviceHistory from "./Pages/Main/Devices/Details/History";
import Helpdesk from "./Pages/Main/Helpdesk";
import Reports from "./Pages/Main/Reports";
import { ParseProvider } from "./Context/ParserContext";
import UsersInfo from "./Pages/Main/Devices/Details/UsersInfo";
import Peripherals from "./Pages/Main/Devices/Details/Peripherals";
import EditEquipment from "./Pages/Main/Users/EditEquipment";
import HelpdeskDetails from "./Pages/Main/Helpdesk/Details";
import Sla from "./Pages/Main/Settings/Details/Sla";
import Personal from "./Pages/Main/Settings/Details/Personal";
import ActiveDirectorySettings from "./Pages/Main/Settings/Details/ActiveDirectory";
import AdminSettings from "./Pages/Main/Settings/Details/Admin";
import AuditLog from "./Pages/Main/Settings/Details/AuditLog";
import Retention from "./Pages/Main/Settings/Details/Retention";
import Privacy from "./Pages/Main/Settings/Details/Privacy";
import Tags from "./Pages/Main/Settings/Details/Tags";
import ComplianceRules from "./Pages/Main/Settings/Details/ComplianceRules";
import TicketTemplates from "./Pages/Main/Settings/Details/TicketTemplates";
import NotificationPreferences from "./Pages/Main/Settings/Details/NotificationPreferences";
import Workflows from "./Pages/Main/Settings/Details/Workflows";
import WindowsAgent from "./Pages/Main/Settings/Details/WindowsAgent";
import UsersReports from "./Pages/Main/Reports/Details/UsersReports";
import DevicesReports from "./Pages/Main/Reports/Details/DevicesReports";
import TicketsReports from "./Pages/Main/Reports/Details/TicketsReports";
import SecurityReports from "./Pages/Main/Reports/Details/SecurityReports";
import Knowledge from "./Pages/Main/Knowledge";
import KnowledgeDetails from "./Pages/Main/Knowledge/Details";
import ArticlePage from "./Pages/Main/Knowledge/Details/ArticlePage";
import History from "./Pages/Main/History";
import UserLayout from "./Pages/User/index";
import UserAccount from "./Pages/User/Account";
import UserTickets from "./Pages/User/Tickets";
import UserTicketDetails from "./Pages/User/Tickets/Details";
import NewUserTicket from "./Pages/User/Tickets/New";
import UserSettings from "./Pages/User/Settings";
import { AnimatePresence } from "framer-motion";
import { useAuthSetup } from "./Hooks/useAuthSetup";
import { ThemeProvider } from "./Context/ThemeContext";
import Tickets from "./Pages/User/Tickets";

function App() {
  useAuthSetup();

  return (
    <AnimatePresence mode="wait">
      <ThemeProvider>
        <ParseProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/admin/dashboards" replace />}
              />
              <Route path="/user" element={<UserLayout />}>
                <Route index element={<Navigate to="account" replace />} />
                <Route path="account" element={<UserAccount />} />
                <Route path="tickets" element={<UserTickets />} />
                <Route path="tickets/new" element={<NewUserTicket />} />
                <Route path="tickets/:id" element={<UserTicketDetails />} />
                <Route path="settings" element={<UserSettings />} />
              </Route>
              <Route path="/admin" element={<Main />}>
                <Route index path="dashboards" element={<Dashboards />} />
                <Route path="users" element={<Users />} />
                <Route path="users/:id" element={<UserDetails />} />
                <Route
                  path="users/:id/equipmentedit"
                  element={<EditEquipment />}
                />
                <Route path="fleet" element={<FleetHealth />} />
                <Route path="devices" element={<Devices />} />
                <Route path="devices/:id" element={<DeviceDetails />}>
                  <Route index path="system" element={<SystemInfo />} />
                  <Route path="hardware" element={<Hardware />} />
                  <Route path="software" element={<Software />} />
                  <Route path="network" element={<Network />} />
                  <Route path="security" element={<Security />} />
                  <Route path="events" element={<Events />} />
                  <Route path="users" element={<UsersInfo />} />
                  <Route path="peripherals" element={<Peripherals />} />
                  <Route path="history" element={<DeviceHistory />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="cves" element={<Cves />} />
                  <Route path="lifecycle" element={<Lifecycle />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="scans" element={<Scans />} />
                </Route>
                <Route path="helpdesk" element={<Helpdesk />} />
                <Route path="helpdesk/:id" element={<HelpdeskDetails />} />
                <Route path="knowledge" element={<Knowledge />} />
                <Route path="knowledge/:id" element={<KnowledgeDetails />} />
                <Route
                  path="knowledge/:id/:articleId"
                  element={<ArticlePage />}
                />
                <Route path="history" element={<History />} />
                <Route path="reports" element={<Reports />}>
                  <Route path="users" element={<UsersReports />} />
                  <Route path="devices" element={<DevicesReports />} />
                  <Route path="tickets" element={<TicketsReports />} />
                  <Route path="security" element={<SecurityReports />} />
                </Route>
                <Route path="settings" element={<Settings />}>
                  <Route index path="personal" element={<Personal />} />
                  <Route
                    path="active-directory"
                    element={<ActiveDirectorySettings />}
                  />
                  <Route path="sla" element={<Sla />} />
                  <Route path="workflows" element={<Workflows />} />
                  <Route
                    path="notifications"
                    element={<NotificationPreferences />}
                  />
                  <Route path="admin" element={<AdminSettings />} />
                  <Route path="audit" element={<AuditLog />} />
                  <Route path="retention" element={<Retention />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="tags" element={<Tags />} />
                  <Route
                    path="compliance-rules"
                    element={<ComplianceRules />}
                  />
                  <Route
                    path="ticket-templates"
                    element={<TicketTemplates />}
                  />
                  <Route path="windows-agent" element={<WindowsAgent />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ParseProvider>
      </ThemeProvider>
    </AnimatePresence>
  );
}

export default App;
