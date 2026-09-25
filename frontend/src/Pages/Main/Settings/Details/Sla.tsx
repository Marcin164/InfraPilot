import { useQuery } from "@tanstack/react-query";
import {
  getCalendar,
  getSlaDefinitions,
  getSlaEscalations,
  getSlaRules,
} from "../../../../Services/sla";
import SlaCalendar from "../components/SlaCalendar";
import SlaDefinitions from "../components/SlaDefinitions";
import SlaRuleMatrix from "../components/SlaRuleMatrix";
import Escalations from "../components/Escalations";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

const Sla = () => {
  const permissionsQuery = usePermissions();
  const canManage = hasPermission("helpdesk.sla.config", permissionsQuery.data);

  const calendarsQuery = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => getCalendar(),
    enabled: canManage,
  });

  const definitionsQuery = useQuery({
    queryKey: ["definitions"],
    queryFn: async () => getSlaDefinitions(),
    enabled: canManage,
  });

  const rulesQuery = useQuery({
    queryKey: ["rules"],
    queryFn: async () => getSlaRules(),
    enabled: canManage,
  });

  const escalationsQuery = useQuery({
    queryKey: ["escalations"],
    queryFn: async () => getSlaEscalations(),
    enabled: canManage,
  });

  if (!canManage) return null;

  return (
    <div className="space-y-4 m-4">
      <SlaCalendar slaCalendars={calendarsQuery.data} />
      <SlaDefinitions slaDefinitions={definitionsQuery?.data} />
      <SlaRuleMatrix slaRules={rulesQuery?.data} />
      <Escalations escalations={escalationsQuery?.data ?? []} />
    </div>
  );
};

export default Sla;
