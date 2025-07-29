import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import UserInfo from "../../../Components/Details/UserInfo";

type Props = {};

const Details = (props: Props) => {
  return (
    <div>
      <UserInfo />
      <div></div>
      <div></div>
    </div>
  );
};

export default Details;
