import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { getDevicesByOwner } from "../../../Services/devices";
import { useAuthInfo } from "@propelauth/react";
import { useParams } from "react-router";
import EquipmentItem from "../../../Components/Lists/EquipmentItem";
import EditEquipmentForm from "../../../Components/Forms/EditEquipmentForm";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import AssignDeviceForm from "../../../Components/Forms/AssignDeviceForm";

type Props = {};

const EditEquipment = (props: Props) => {
  const { accessToken } = useAuthInfo();
  const params: any = useParams();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [addDeviceMode, setAddDeviceMode] = useState<any>(false);
  const userDevices = useQuery({
    queryKey: ["userDevice"],
    queryFn: () => getDevicesByOwner(accessToken, params.id),
  });

  if (!userDevices.data) return null;

  const mainDevices = userDevices.data.filter(
    (device: any) => device.userId == params.id && device.group === "Computers",
  );

  const peripherals = userDevices.data.filter(
    (device: any) =>
      device.userId == params.id && device.group === "Peripherals",
  );

  const getAssetDetails = (assetId: any) => {
    const asset = userDevices.data.find((device: any) => device.id === assetId);
    setAddDeviceMode(false);
    setSelectedAsset(asset);
  };

  return (
    <div className="p-4 w-full flex">
      <div className="h-fit w-[40%] bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4 mr-2">
        <div className="text-[30px] font-semibold text-[#3C3C3C]">
          Edit Equipment
        </div>
        <div className="h-[calc(100%-100px)]">
          <div className="py-2 font-bold">Computers</div>
          {mainDevices?.length > 0 ? (
            mainDevices.map((device: any) => (
              <EquipmentItem
                {...device}
                editMode
                onEditClick={getAssetDetails}
              />
            ))
          ) : (
            <div>No device</div>
          )}
          <div className="py-2 font-bold">Peripherals</div>
          {peripherals?.length > 0 ? (
            peripherals.map((peripheral: any) => (
              <EquipmentItem
                {...peripheral}
                editMode
                onEditClick={getAssetDetails}
              />
            ))
          ) : (
            <div>No device</div>
          )}
          <ButtonPrimary
            icon={faPen}
            text="Assign device"
            className="mt-2"
            onClick={() => {
              setSelectedAsset(null);
              setAddDeviceMode(true);
            }}
          />
        </div>
      </div>
      {!selectedAsset && addDeviceMode && (
        <div className="w-[60%] bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4 ml-2">
          <div className="text-[30px] font-semibold text-[#3C3C3C]">
            Assign device
          </div>
          <div>
            <AssignDeviceForm />
          </div>
        </div>
      )}
      {!addDeviceMode && selectedAsset && (
        <div className="w-[60%] bg-[#FFFFFF] shadow-xl rounded-[10px] row-span-3 p-4 ml-2">
          <div className="text-[30px] font-semibold text-[#3C3C3C]">
            Equipment details
          </div>
          <div>
            <EditEquipmentForm {...selectedAsset} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEquipment;
