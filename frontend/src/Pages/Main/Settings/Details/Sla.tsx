import { useQuery } from "@tanstack/react-query";
import {
  getCalendar,
  getSlaDefinitions,
  getSlaEscalations,
  getSlaRules,
} from "../../../../Services/sla";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import SlaCalendar from "../components/SlaCalendar";
import SlaDefinitions from "../components/SlaDefinitions";
import SlaRules from "../components/SlaRules";
import Escalations from "../components/Escalations";

type Props = {};

const Sla = (props: Props) => {
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
    <div className="w-full cursor-default overflow-x-hidden pb-8">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <SlaCalendar slaCalendars={calendarsQuery.data} />
          <SlaDefinitions slaDefinitions={definitionsQuery?.data} />
          <SlaRules slaRules={rulesQuery?.data} />
          <Escalations escalations={escalationsQuery?.data ?? []} />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Sla;
