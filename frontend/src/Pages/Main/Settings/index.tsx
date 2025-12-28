import React from "react";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import CardHeader from "../../../Components/Headers/CardHeader";
import Personal from "./Details/Personal";
import { useAuthInfo } from "@propelauth/react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "../../../Services/agent";

type Props = {};

const index = (props: Props) => {
  const { accessToken, user } = useAuthInfo();
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(accessToken),
  });

  return (
    <>
      <Personal />
      <div className="bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 m-4">
        <CardHeader text="General" />
        <div className="pt-2 pb-4 text-[#3C3C3C] font-semibold">
          Active Directory
        </div>
        <div>
          <ButtonPrimary
            text="Connect to active directory"
            onClick={() => {}}
          />
        </div>
      </div>
    </>
  );
};

export default index;
