import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faMagnifyingGlass, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import { getNetworkScanSettings, saveNetworkScanSettings } from "../../../../Services/devices";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

const NetworkScanSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [autoCreateDevices, setAutoCreateDevices] = useState(true);

  const settingsQuery = useQuery({
    queryKey: ["network-scan-settings"],
    queryFn: getNetworkScanSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) setAutoCreateDevices(settingsQuery.data.autoCreateDevices);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveNetworkScanSettings({ autoCreateDevices }),
    onSuccess: () => {
      toast.success(t("settings.networkScan.saved"));
      queryClient.invalidateQueries({ queryKey: ["network-scan-settings"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.networkScan.saveFailed")),
  });

  const permissionsQuery = usePermissions();
  if (!hasPermission("devices.agentConfig.manage", permissionsQuery.data)) return null;

  if (settingsQuery.isLoading) {
    return <div className="p-4 text-[#7a7a7a]">Loading...</div>;
  }
  if (settingsQuery.isError) {
    return (
      <div className="p-4 bg-white rounded-[10px] shadow-xl">
        <CardHeader text={t("settings.tab.networkScan")} icon={faTriangleExclamation} />
        <p className="text-[#BC0E0E] mt-2">
          {(settingsQuery.error as any)?.response?.data?.message ?? t("settings.networkScan.loadFailed")}
        </p>
      </div>
    );
  }

  const dirty = settingsQuery.data && autoCreateDevices !== settingsQuery.data.autoCreateDevices;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text={t("settings.tab.networkScan")} icon={faMagnifyingGlass} />
        <p className="text-[14px] text-[#535353] mt-2">
          {t("settings.networkScan.intro")}
        </p>
      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <Checkbox
          label={t("settings.networkScan.autoCreateDevices")}
          checked={autoCreateDevices}
          handleChange={(v: boolean) => setAutoCreateDevices(v)}
        />
        <p className="text-[12px] text-[#9a9a9a] mt-2 max-w-[560px]">
          {t("settings.networkScan.autoCreateDevicesHint")}
        </p>

        <ButtonPrimary
          text={saveMutation.isPending ? t("common.saving") : t("common.save")}
          className="mt-4"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
        />
      </div>
    </div>
  );
};

export default NetworkScanSettings;
