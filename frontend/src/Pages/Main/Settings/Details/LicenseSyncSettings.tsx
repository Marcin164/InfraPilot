import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faCloud,
  faCircleCheck,
  faCircleXmark,
  faSpinner,
  faArrowsRotate,
  faArrowUpRightFromSquare,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faGithub, faDropbox } from "@fortawesome/free-brands-svg-icons";
import moment from "moment";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import { getM365Config, getM365SyncStatus, syncM365Licenses } from "../../../../Services/m365";
import { getGoogleWorkspaceConfig, getGoogleWorkspaceSyncStatus, syncGoogleWorkspaceLicenses } from "../../../../Services/googleWorkspace";
import { getGithubConfig, getGithubSyncStatus, syncGithubLicenses } from "../../../../Services/githubEnterprise";
import { getZoomConfig, getZoomSyncStatus, syncZoomLicenses } from "../../../../Services/zoom";
import { getDropboxConfig, getDropboxSyncStatus, syncDropboxLicenses } from "../../../../Services/dropbox";
import { getLicenses, type LicenseSource } from "../../../../Services/licenses";
import { useCurrentUser } from "../../../../Hooks/useCurrentUser";
import { hasRequiredRole } from "../../../../Constants/navigation";
import GoogleWorkspaceConfigModal from "./GoogleWorkspaceConfigModal";
import GitHubEnterpriseConfigModal from "./GitHubEnterpriseConfigModal";
import ZoomConfigModal from "./ZoomConfigModal";
import DropboxConfigModal from "./DropboxConfigModal";

// Provider brand names are proper nouns and stay untranslated across locales.
const BRAND_LABELS: Partial<Record<LicenseSource, string>> = {
  m365: "Microsoft 365",
  google: "Google Workspace",
  github: "GitHub Enterprise",
  zoom: "Zoom",
  dropbox: "Dropbox",
};

const ALL_SOURCES: LicenseSource[] = ["manual", "m365", "google", "github", "zoom", "dropbox"];

const ProviderSyncCard = ({
  title,
  icon,
  onConfigure,
  isConnected,
  lastSync,
  onSync,
  syncPending,
  syncDisabled,
  syncError,
}: {
  title: string;
  icon: any;
  onConfigure: () => void;
  isConnected: boolean;
  lastSync: string | null | undefined;
  onSync: () => void;
  syncPending: boolean;
  syncDisabled: boolean;
  syncError: string | null;
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3">
        <CardHeader text={title} icon={icon} />
        <button
          onClick={onConfigure}
          className="text-[13px] text-[#2B9AE9] hover:underline flex items-center gap-1 shrink-0"
        >
          {t("licenseSync.configure")} <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[11px]" />
        </button>
      </div>

      <div className={`flex items-center gap-2 mb-3 text-[13px] font-medium ${isConnected ? "text-green-600" : "text-[#9a9a9a]"}`}>
        <FontAwesomeIcon icon={isConnected ? faCircleCheck : faCircleXmark} />
        {isConnected ? t("licenseSync.connected") : t("licenseSync.notConfigured")}
      </div>

      {lastSync && (
        <div className="text-[13px] text-[#7a7a7a] mb-3">
          {t("licenseSync.lastSync", { date: moment(lastSync).format("DD.MM.YYYY HH:mm:ss") })}
        </div>
      )}

      <ButtonPrimary
        text={syncPending ? t("licenseSync.syncing") : t("licenseSync.syncNow")}
        icon={syncPending ? faSpinner : faArrowsRotate}
        onClick={onSync}
        disabled={syncDisabled || syncPending}
      />

      {syncError && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-red-600">
          <FontAwesomeIcon icon={faCircleXmark} />
          {syncError}
        </div>
      )}
    </div>
  );
};

const LicenseSyncSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState<"google" | "github" | "zoom" | "dropbox" | null>(null);

  const m365ConfigQuery = useQuery({ queryKey: ["m365-config"], queryFn: getM365Config });
  const m365SyncStatusQuery = useQuery({ queryKey: ["m365-sync-status"], queryFn: getM365SyncStatus });
  const googleConfigQuery = useQuery({ queryKey: ["google-config"], queryFn: getGoogleWorkspaceConfig });
  const googleSyncStatusQuery = useQuery({ queryKey: ["google-sync-status"], queryFn: getGoogleWorkspaceSyncStatus });
  const githubConfigQuery = useQuery({ queryKey: ["github-config"], queryFn: getGithubConfig });
  const githubSyncStatusQuery = useQuery({ queryKey: ["github-sync-status"], queryFn: getGithubSyncStatus });
  const zoomConfigQuery = useQuery({ queryKey: ["zoom-config"], queryFn: getZoomConfig });
  const zoomSyncStatusQuery = useQuery({ queryKey: ["zoom-sync-status"], queryFn: getZoomSyncStatus });
  const dropboxConfigQuery = useQuery({ queryKey: ["dropbox-config"], queryFn: getDropboxConfig });
  const dropboxSyncStatusQuery = useQuery({ queryKey: ["dropbox-sync-status"], queryFn: getDropboxSyncStatus });
  const licensesQuery = useQuery({ queryKey: ["licenses"], queryFn: getLicenses });

  const isM365Connected = !!m365ConfigQuery.data?.tenantId && m365ConfigQuery.data.hasSecret;
  const isGoogleConnected = !!googleConfigQuery.data?.adminEmail && googleConfigQuery.data.hasServiceAccount
    && (googleConfigQuery.data.skus?.length ?? 0) > 0;
  const isGithubConnected = !!githubConfigQuery.data?.enterpriseSlug && githubConfigQuery.data.hasToken;
  const isZoomConnected = !!zoomConfigQuery.data?.accountId && zoomConfigQuery.data.hasSecret;
  const isDropboxConnected = !!dropboxConfigQuery.data?.appKey && dropboxConfigQuery.data.hasSecret && dropboxConfigQuery.data.hasRefreshToken;

  const m365SyncMutation = useMutation({
    mutationFn: syncM365Licenses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["m365-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });

  const googleSyncMutation = useMutation({
    mutationFn: syncGoogleWorkspaceLicenses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });

  const githubSyncMutation = useMutation({
    mutationFn: syncGithubLicenses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });

  const zoomSyncMutation = useMutation({
    mutationFn: syncZoomLicenses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zoom-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });

  const dropboxSyncMutation = useMutation({
    mutationFn: syncDropboxLicenses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dropbox-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const license of licensesQuery.data ?? []) {
      counts[license.source] = (counts[license.source] ?? 0) + 1;
    }
    return counts;
  }, [licensesQuery.data]);

  const sourceLabel = (source: LicenseSource) =>
    source === "manual" ? t("licenses.source.manual") : BRAND_LABELS[source] ?? source;

  const currentUserQuery = useCurrentUser();
  if (!hasRequiredRole("admin", currentUserQuery.data)) return null;

  return (
    <div className="m-4 space-y-4">
      {/* ─── Summary ────────────────────────────────────────────────────── */}
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text={t("licenseSync.title")} icon={faKey} />
        <div className="mt-3 text-[13px] text-[#7a7a7a] mb-4">
          {t("licenseSync.description")}
        </div>
        <div className="flex flex-wrap gap-3">
          {ALL_SOURCES.map((source) => (
            <span
              key={source}
              className="bg-[#F5F5F5] text-[#3C3C3C] border border-[#E0E0E0] px-3 py-1 rounded-full text-[13px] font-medium"
            >
              {sourceLabel(source)}: {sourceCounts[source] ?? 0}
            </span>
          ))}
        </div>
      </div>

      <ProviderSyncCard
        title={BRAND_LABELS.m365 + " / Entra ID"}
        icon={faCloud}
        onConfigure={() => navigate("/admin/settings/m365")}
        isConnected={isM365Connected}
        lastSync={m365SyncStatusQuery.data?.licensesLastSync}
        onSync={() => m365SyncMutation.mutate()}
        syncPending={m365SyncMutation.isPending}
        syncDisabled={!isM365Connected}
        syncError={m365SyncMutation.isError ? ((m365SyncMutation.error as any)?.response?.data?.message ?? t("licenseSync.syncError")) : null}
      />

      <ProviderSyncCard
        title={BRAND_LABELS.google!}
        icon={faGoogle}
        onConfigure={() => setOpenModal("google")}
        isConnected={isGoogleConnected}
        lastSync={googleSyncStatusQuery.data?.licensesLastSync}
        onSync={() => googleSyncMutation.mutate()}
        syncPending={googleSyncMutation.isPending}
        syncDisabled={!isGoogleConnected}
        syncError={googleSyncMutation.isError ? ((googleSyncMutation.error as any)?.response?.data?.message ?? t("licenseSync.syncError")) : null}
      />

      <ProviderSyncCard
        title={BRAND_LABELS.github!}
        icon={faGithub}
        onConfigure={() => setOpenModal("github")}
        isConnected={isGithubConnected}
        lastSync={githubSyncStatusQuery.data?.licensesLastSync}
        onSync={() => githubSyncMutation.mutate()}
        syncPending={githubSyncMutation.isPending}
        syncDisabled={!isGithubConnected}
        syncError={githubSyncMutation.isError ? ((githubSyncMutation.error as any)?.response?.data?.message ?? t("licenseSync.syncError")) : null}
      />

      <ProviderSyncCard
        title={BRAND_LABELS.zoom!}
        icon={faVideo}
        onConfigure={() => setOpenModal("zoom")}
        isConnected={isZoomConnected}
        lastSync={zoomSyncStatusQuery.data?.licensesLastSync}
        onSync={() => zoomSyncMutation.mutate()}
        syncPending={zoomSyncMutation.isPending}
        syncDisabled={!isZoomConnected}
        syncError={zoomSyncMutation.isError ? ((zoomSyncMutation.error as any)?.response?.data?.message ?? t("licenseSync.syncError")) : null}
      />

      <ProviderSyncCard
        title={BRAND_LABELS.dropbox!}
        icon={faDropbox}
        onConfigure={() => setOpenModal("dropbox")}
        isConnected={isDropboxConnected}
        lastSync={dropboxSyncStatusQuery.data?.licensesLastSync}
        onSync={() => dropboxSyncMutation.mutate()}
        syncPending={dropboxSyncMutation.isPending}
        syncDisabled={!isDropboxConnected}
        syncError={dropboxSyncMutation.isError ? ((dropboxSyncMutation.error as any)?.response?.data?.message ?? t("licenseSync.syncError")) : null}
      />

      <GoogleWorkspaceConfigModal isOpen={openModal === "google"} onClose={() => setOpenModal(null)} />
      <GitHubEnterpriseConfigModal isOpen={openModal === "github"} onClose={() => setOpenModal(null)} />
      <ZoomConfigModal isOpen={openModal === "zoom"} onClose={() => setOpenModal(null)} />
      <DropboxConfigModal isOpen={openModal === "dropbox"} onClose={() => setOpenModal(null)} />
    </div>
  );
};

export default LicenseSyncSettings;
