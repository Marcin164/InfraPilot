import { useQuery } from "@tanstack/react-query";
import {
  getCalendar,
  getSlaDefinitions,
  getSlaEscalations,
  getSlaRules,
} from "../../../../Services/sla";
import SlaCalendar from "../components/SlaCalendar";
import SlaDefinitions from "../components/SlaDefinitions";
import SlaRules from "../components/SlaRules";
import Escalations from "../components/Escalations";

const Sla = () => {
  const calendarsQuery = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => getCalendar(),
  });

  const definitionsQuery = useQuery({
    queryKey: ["definitions"],
    queryFn: async () => getSlaDefinitions(),
  });

  const rulesQuery = useQuery({
    queryKey: ["rules"],
    queryFn: async () => getSlaRules(),
  });

  const escalationsQuery = useQuery({
    queryKey: ["escalations"],
    queryFn: async () => getSlaEscalations(),
  });

  return (
    <div className="space-y-4 m-4">
      <SlaCalendar slaCalendars={calendarsQuery.data} />
      <SlaDefinitions slaDefinitions={definitionsQuery?.data} />
      <SlaRules slaRules={rulesQuery?.data} />
      <Escalations escalations={escalationsQuery?.data ?? []} />
    </div>
  );
};

export default Sla;
