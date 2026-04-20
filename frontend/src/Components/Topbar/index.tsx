import { Link, useLocation } from "react-router";
import { capitalize, splitPath } from "../../Helpers/string";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import GlobalSearch from "./GlobalSearch";
import { useParser } from "../../Hooks/useParser";
import AccountButton from "./AccountButton";

const Topbar = () => {
  const location = useLocation();
  const breadCrumbs: string[] = splitPath(location.pathname, "/");
  const { parsers, parser } = useParser();

  const resolve = (segment: string): string => {
    if (parsers[segment]) return parsers[segment];
    if (segment === parser?.id && parser?.name) return capitalize(parser.name);
    return capitalize(segment);
  };

  return (
    <div className="flex items-center justify-between bg-[#FFFFFF] px-4 py-3">
      <div className="capitalize">
        {breadCrumbs.map((breadCrumb: string, index: number) => {
          if (breadCrumb === "admin") return null;
          const isLast = index === breadCrumbs.length - 1;
          return (
            <span
              key={index}
              style={{ textTransform: "capitalize" }}
              className="text-[22px] text-[#3C3C3C]"
            >
              <Link
                to={"/" + breadCrumbs.slice(0, index + 1).join("/")}
                className={isLast ? "" : "underline hover:text-[#2B9AE9]"}
              >
                {resolve(breadCrumb)}
              </Link>
              {!isLast && (
                <FontAwesomeIcon icon={faChevronRight} className="px-2" />
              )}
            </span>
          );
        })}
      </div>
      <div className="flex">
        <GlobalSearch />
        <AccountButton />
      </div>
    </div>
  );
};

export default Topbar;
