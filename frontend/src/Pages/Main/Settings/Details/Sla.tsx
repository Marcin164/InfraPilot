import { useQuery } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import {
  getCalendar,
  getSlaDefinitions,
  getSlaEscalations,
  getSlaRules,
} from "../../../../Services/sla";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import SlaCalendar from "../../../../Components/Details/SlaCalendar";
import SlaDefinitions from "../../../../Components/Details/SlaDefinitions";
import SlaRules from "../../../../Components/Details/SlaRules";
import Escalations from "../../../../Components/Details/Escalations";

type Props = {};

const Sla = (props: Props) => {
  const { accessToken } = useAuthInfo();

  const calendarsQuery = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => getCalendar(accessToken),
  });

  const definitionsQuery = useQuery({
    queryKey: ["definitions"],
    queryFn: async () => getSlaDefinitions(accessToken),
  });

  const rulesQuery = useQuery({
    queryKey: ["rules"],
    queryFn: async () => getSlaRules(accessToken),
  });

  const escalationsQuery = useQuery({
    queryKey: ["escalations"],
    queryFn: async () => getSlaEscalations(accessToken),
  });

  return (
    <div className="w-full cursor-default overflow-x-hidden pb-8">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry>
          <SlaCalendar slaCalendars={calendarsQuery.data} />
          <SlaDefinitions slaDefinitions={definitionsQuery?.data} />
          <SlaRules slaRules={rulesQuery?.data} />
          <Escalations escalations={escalationsQuery?.data} />
        </Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default Sla;
