import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faRobot, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import {
  getAiSettings,
  saveAiSettings,
  ALL_AI_SURFACES,
  AI_MODEL_OPTIONS,
  type AiSurface,
} from "../../../../Services/ai";
import { getSpaces } from "../../../../Services/knowledge";
import { usePermissions } from "../../../../Hooks/usePermissions";
import { hasPermission } from "../../../../Constants/navigation";

const SURFACE_LABEL_KEYS: Record<AiSurface, string> = {
  adminTicketAssist: "settings.ai.surface.adminTicketAssist",
  userTicketAssist: "settings.ai.surface.userTicketAssist",
  logAnalysis: "settings.ai.surface.logAnalysis",
  ticketClosureSummary: "settings.ai.surface.ticketClosureSummary",
};

const SURFACE_HINT_KEYS: Record<AiSurface, string> = {
  adminTicketAssist: "settings.ai.surface.adminTicketAssistHint",
  userTicketAssist: "settings.ai.surface.userTicketAssistHint",
  logAnalysis: "settings.ai.surface.logAnalysisHint",
  ticketClosureSummary: "settings.ai.surface.ticketClosureSummaryHint",
};

const AiSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissionsQuery = usePermissions();
  const canManage = hasPermission("admin.ai.config", permissionsQuery.data);

  const [model, setModel] = useState("");
  const [enabledSurfaces, setEnabledSurfaces] = useState<AiSurface[]>([
    ...ALL_AI_SURFACES,
  ]);
  const [knowledgeSpaceId, setKnowledgeSpaceId] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["ai-settings"],
    queryFn: getAiSettings,
    enabled: canManage,
  });
  const canViewKnowledge = hasPermission(
    ["knowledge.view", "knowledge.manage"],
    permissionsQuery.data,
  );
  const spacesQuery = useQuery({
    queryKey: ["knowledge-spaces"],
    queryFn: getSpaces,
    enabled: canManage && canViewKnowledge,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setModel(settingsQuery.data.model);
      setEnabledSurfaces(settingsQuery.data.enabledSurfaces);
      setKnowledgeSpaceId(settingsQuery.data.knowledgeSpaceId);
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => saveAiSettings({ model, enabledSurfaces, knowledgeSpaceId }),
    onSuccess: () => {
      toast.success(t("settings.ai.saved"));
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("settings.ai.saveFailed")),
  });

  if (!canManage) return null;

  if (settingsQuery.isLoading) {
    return <div className="p-4 text-[#7a7a7a]">Loading...</div>;
  }
  if (settingsQuery.isError) {
    return (
      <div className="p-4 bg-white rounded-[10px] shadow-xl">
        <CardHeader text={t("settings.tab.ai")} icon={faTriangleExclamation} />
        <p className="text-[#BC0E0E] mt-2">
          {(settingsQuery.error as any)?.response?.data?.message ??
            t("settings.ai.loadFailed")}
        </p>
      </div>
    );
  }

  const toggleSurface = (surface: AiSurface, checked: boolean) => {
    setEnabledSurfaces((prev) =>
      checked ? [...new Set([...prev, surface])] : prev.filter((s) => s !== surface),
    );
  };

  const dirty =
    settingsQuery.data &&
    (model !== settingsQuery.data.model ||
      knowledgeSpaceId !== settingsQuery.data.knowledgeSpaceId ||
      enabledSurfaces.length !== settingsQuery.data.enabledSurfaces.length ||
      enabledSurfaces.some((s) => !settingsQuery.data!.enabledSurfaces.includes(s)));

  const modelOptions = [
    { value: "", label: t("settings.ai.modelDefault") },
    ...AI_MODEL_OPTIONS.map((m) => ({ value: m, label: m })),
  ];

  const spaces = spacesQuery.data ?? [];
  const spaceOptions = [
    { value: "", label: t("settings.ai.spaceAuto") },
    ...spaces.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text={t("settings.tab.ai")} icon={faRobot} />
        <p className="text-[14px] text-[#535353] mt-2">
          {t("settings.ai.intro")}
        </p>
      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <h3 className="font-bold text-[#3C3C3C] text-[15px] mb-1">
          {t("settings.ai.modelTitle")}
        </h3>
        <p className="text-[12px] text-[#9a9a9a] mb-2 max-w-[560px]">
          {t("settings.ai.modelHint")}
        </p>
        <div className="max-w-[320px]">
          <SelectSecondary
            options={modelOptions}
            value={modelOptions.find((o) => o.value === model) ?? modelOptions[0]}
            onSelect={(opt: any) => setModel(opt?.value ?? "")}
          />
        </div>
      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <h3 className="font-bold text-[#3C3C3C] text-[15px] mb-1">
          {t("settings.ai.surfacesTitle")}
        </h3>
        <p className="text-[12px] text-[#9a9a9a] mb-3 max-w-[560px]">
          {t("settings.ai.surfacesHint")}
        </p>
        <div className="space-y-3">
          {ALL_AI_SURFACES.map((surface) => (
            <div key={surface} className="border-b border-[#F0F0F0] pb-3 last:border-0 last:pb-0">
              <Checkbox
                label={t(SURFACE_LABEL_KEYS[surface])}
                checked={enabledSurfaces.includes(surface)}
                handleChange={(v: boolean) => toggleSurface(surface, v)}
              />
              <p className="text-[12px] text-[#9a9a9a] mt-1 max-w-[560px]">
                {t(SURFACE_HINT_KEYS[surface])}
              </p>
            </div>
          ))}
        </div>

      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <h3 className="font-bold text-[#3C3C3C] text-[15px] mb-1">
          {t("settings.ai.spaceTitle")}
        </h3>
        <p className="text-[12px] text-[#9a9a9a] mb-2 max-w-[560px]">
          {t("settings.ai.spaceHint")}
        </p>
        {canViewKnowledge ? (
          <div className="max-w-[320px]">
            <SelectSecondary
              options={spaceOptions}
              value={
                spaceOptions.find((o) => o.value === knowledgeSpaceId) ??
                spaceOptions[0]
              }
              onSelect={(opt: any) => setKnowledgeSpaceId(opt?.value ?? "")}
            />
          </div>
        ) : (
          <p className="text-[11px] text-[#C07C0F]">
            {t("settings.ai.spaceNoAccess")}
          </p>
        )}

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

export default AiSettings;
