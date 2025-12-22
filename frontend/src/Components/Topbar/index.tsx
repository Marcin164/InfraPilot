import React from "react";
import { Link, useLocation } from "react-router";
import { capitalize, splitPath } from "../../Helpers/string";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Search from "../Inputs/Search";
import { useParser } from "../../Hooks/useParser";
import AccountButton from "./AccountButton";
import { twMerge } from "tailwind-merge";

type Props = {};

const index = (props: Props) => {
  const location = useLocation();
  const breadCrumbs: any = splitPath(location.pathname, "/");
  const { parser } = useParser();
  console.log(breadCrumbs);

  return (
    <div className="flex items-center justify-between bg-[#FFFFFF] px-4 py-3">
      <div className="capitalize">
        {breadCrumbs.map((breadCrumb: string, index: number) => (
          <span
            style={{ textTransform: "capitalize" }}
            className="text-[22px] text-[#3C3C3C]"
          >
            <Link
              to={"/" + breadCrumbs.slice(0, index + 1).join("/")}
              className={
                index !== breadCrumbs.length - 1
                  ? "underline hover:text-[#2B9AE9]"
                  : ""
              }
            >
              {breadCrumb === parser?.id
                ? capitalize(`${parser?.name}`)
                : capitalize(breadCrumb)}
            </Link>
            {index !== breadCrumbs.length - 1 && (
              <FontAwesomeIcon icon={faChevronRight} className="px-2" />
            )}
          </span>
        ))}
      </div>
      <div className="flex">
        <Search onChange={() => {}} className="border border-[#EFEFEF]" />
        <AccountButton />
      </div>
    </div>
  );
};

export default index;
