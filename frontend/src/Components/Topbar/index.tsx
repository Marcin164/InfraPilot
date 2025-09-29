import React from "react";
import { useLocation, useParams, useResolvedPath } from "react-router";
import { capitalize, splitPath } from "../../Helpers/string";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Search from "../Inputs/Search";
import { useParser } from "../../Hooks/useParser";

type Props = {};

const index = (props: Props) => {
  const location = useLocation();
  const breadCrumbs: any = splitPath(location.pathname, "/");
  const { parser } = useParser();

  return (
    <div className="h-[100px] flex items-center justify-between bg-[#FFFFFF] px-4">
      <div className="capitalize">
        {breadCrumbs.map((breadCrumb: string, index: number) => (
          <span
            style={{ textTransform: "capitalize" }}
            className="text-[22px] text-[#3C3C3C]"
          >
            {breadCrumb == parser?.id
              ? capitalize(parser.name)
              : capitalize(breadCrumb)}
            {index !== breadCrumbs.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="px-2" />
            )}
          </span>
        ))}
      </div>
      <div>
        <Search />
      </div>
    </div>
  );
};

export default index;
