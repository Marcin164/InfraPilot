import React from "react";
import { useLocation, useParams } from "react-router";
import { splitPath } from "../../Helpers/string";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Search from "../Inputs/Search";

type Props = {};

const index = (props: Props) => {
  const location = useLocation();
  const params = useParams();
  const breadCrumbs: any = splitPath(location.pathname, "/");

  return (
    <div className="h-[100px] flex items-center justify-between bg-[#FFFFFF] px-4">
      <div className="capitalize">
        {breadCrumbs.map((breadCrumb: string, index: number) => (
          <span className="text-[30px] text-[#3C3C3C]">
            {breadCrumb}
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
