import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type Props = {};

const UserInfo = (props: Props) => {
  return (
    <div>
      <div>
        <img />
        <div>
          <div>Marcin Nowakowski</div>
          <div>
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Enabled</span>
          </div>
        </div>
      </div>
      <div>
        <div>Developers team</div>
      </div>
    </div>
  );
};

export default UserInfo;
