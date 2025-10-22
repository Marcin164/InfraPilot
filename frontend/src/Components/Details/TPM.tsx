import React from "react";
import Parameter from "../Lists/Parameter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";

type Props = {
  SpecVersion: any;
  ManufacturerIDTxt: any;
  ManufacturerVersion: any;
  IsOwned_InitialValue: any;
  IsEnabled_InitialValue: any;
  IsActivated_InitialValue: any;
};

const TPM = ({
  SpecVersion,
  ManufacturerIDTxt,
  ManufacturerVersion,
  IsOwned_InitialValue,
  IsEnabled_InitialValue,
  IsActivated_InitialValue,
}: Props) => {
  return (
    <div className="w-full h-full bg-[#FFFFFF] shadow-xl rounded-[10px] p-4 mb-4">
      <div className="text-[20px] font-semibold text-[#2B9AE9]">TPM</div>
      <Parameter name="Spec Version" value={SpecVersion} />
      <Parameter
        name="Manufacturer"
        value={`${ManufacturerIDTxt} - ${ManufacturerVersion}`}
      />
      <div
        className={twMerge(
          "w-fit mr-2 px-2 rounded-[5px] text-[16px] mt-2 text-center text-[#FFFFFF]",
          IsActivated_InitialValue ? "bg-[#30A712]" : "bg-[#F3606A]"
        )}
      >
        <FontAwesomeIcon
          icon={IsActivated_InitialValue ? faToggleOn : faToggleOff}
        />
        <span className="ml-1">
          {IsActivated_InitialValue ? "Active" : "Inactive"}
        </span>
      </div>
      <div
        className={twMerge(
          "w-fit mr-2 px-2 rounded-[5px] text-[16px] mt-2 text-center text-[#FFFFFF]",
          IsEnabled_InitialValue ? "bg-[#30A712]" : "bg-[#F3606A]"
        )}
      >
        <FontAwesomeIcon
          icon={IsEnabled_InitialValue ? faToggleOn : faToggleOff}
        />
        <span className="ml-1">
          {IsEnabled_InitialValue ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div
        className={twMerge(
          "w-fit mr-2 px-2 rounded-[5px] text-[16px] mt-2 text-center text-[#FFFFFF]",
          IsOwned_InitialValue ? "bg-[#30A712]" : "bg-[#F3606A]"
        )}
      >
        <FontAwesomeIcon
          icon={IsOwned_InitialValue ? faToggleOn : faToggleOff}
        />
        <span className="ml-1">
          {IsOwned_InitialValue ? "Owned" : "Disowned"}
        </span>
      </div>
    </div>
  );
};

export default TPM;
