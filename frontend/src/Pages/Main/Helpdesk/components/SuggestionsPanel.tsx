import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { faBookOpen, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

import { searchArticles } from "../../../../Services/knowledge";
import { getSimilarTickets } from "../../../../Services/tickets";

type Props = {
  ticket: any;
};

const buildKbQuery = (ticket: any) => {
  const tokens = (ticket?.description ?? "")
    .toLowerCase()
    .replace(/[^\p{L}0-9 ]+/gu, " ")
    .split(/\s+/)
    .filter((t: string) => t.length > 3)
    .slice(0, 4);
  return [ticket?.category, ...tokens].filter(Boolean).join(" ");
};

const SuggestionsPanel = ({ ticket }: Props) => {
  const kbQuery = useMemo(() => buildKbQuery(ticket), [ticket]);

  const articlesQuery = useQuery({
    queryKey: ["kb-suggest", kbQuery],
    queryFn: () => searchArticles(kbQuery),
    enabled: kbQuery.trim().length > 2,
    staleTime: 60000,
  });

  const similarQuery = useQuery({
    queryKey: ["similar-tickets", ticket?.id],
    queryFn: () => getSimilarTickets(ticket.id, 5),
    enabled: Boolean(ticket?.id),
    staleTime: 60000,
  });

  const articles = (articlesQuery.data ?? []).slice(0, 5);
  const similar = similarQuery.data ?? [];

  if (articles.length === 0 && similar.length === 0) return null;

  return (
    <div className="mt-4 rounded-[8px] border border-[#FCEFCC] bg-[#FFFBEF] p-3">
      <div className="flex items-center gap-2 mb-2">
        <FontAwesomeIcon icon={faLightbulb} className="text-[#F1C40F]" />
        <span className="text-[13px] font-bold text-[#3C3C3C]">
          Suggestions
        </span>
      </div>

      {articles.length > 0 && (
        <div className="mb-2">
          <div className="text-[11px] font-bold text-[#9a9a9a] uppercase mb-1">
            <FontAwesomeIcon icon={faBookOpen} className="mr-1" />
            Knowledge base
          </div>
          <div className="space-y-1">
            {articles.map((a: any) => (
              <Link
                key={a.id}
                to={`/admin/knowledge/${a.spaceId}/${a.id}`}
                className="block px-2 py-1 text-[12px] text-[#2B9AE9] hover:underline rounded hover:bg-white"
              >
                {a.title}
                {a.category && (
                  <span className="text-[10px] text-[#9a9a9a] ml-2">
                    [{a.category}]
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-[#9a9a9a] uppercase mb-1">
            Similar resolved tickets
          </div>
          <div className="space-y-1">
            {similar.map((t: any) => (
              <Link
                key={t.id}
                to={`/admin/helpdesk/${t.id}`}
                className="block px-2 py-1 text-[12px] rounded hover:bg-white"
              >
                <span className="font-bold text-[#3C3C3C] mr-2">
                  #{t.number}
                </span>
                <span className="text-[#535353]">
                  {(t.description ?? t.category ?? "—").slice(0, 70)}
                </span>
                <span className="text-[10px] text-[#9a9a9a] ml-2">
                  {t.resolvedAt
                    ? moment(t.resolvedAt).fromNow()
                    : moment(t.updatedAt).fromNow()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;
