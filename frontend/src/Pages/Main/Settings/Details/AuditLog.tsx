import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import moment from "moment";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faCircleCheck,
  faCircleExclamation,
  faDownload,
  faRotateRight,
  faFilterCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { listAudit, verifyAudit, exportAuditCsv } from "../../../../Services/audit";
import type { AuditEntry, AuditVerifyResult } from "../../../../Services/audit";
import { getUsers } from "../../../../Services/users";
import CardHeader from "../../../../Components/Headers/CardHeader";
import MainTable from "../../../../Components/Tables/MainTable";
import Input from "../../../../Components/Inputs/Input";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";

const ACTION_COLOR: Record<string, string> = {
  CREATED: "#30A712",
  created: "#30A712",
  UPDATED: "#F1C40F",
  updated: "#F1C40F",
  DELETED: "#F3606E",
  deleted: "#F3606E",
};

const actionColor = (action: string) =>
  ACTION_COLOR[action] ??
  (/creat|enrolled|assign/i.test(action)
    ? "#30A712"
    : /delet|cancel|revoke/i.test(action)
      ? "#F3606E"
      : /updat|chang|rotat/i.test(action)
        ? "#F1C40F"
        : "#8A8A8A");

// Only entity types with a real per-id detail route get a deep link.
const ENTITY_LINK: Record<string, (id: string) => string> = {
  Device: (id) => `/admin/devices/${id}/system`,
  Ticket: (id) => `/admin/helpdesk/${id}`,
};

type Filters = {
  entityType: string;
  entityId: string;
  action: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  entityType: "",
  entityId: "",
  action: "",
  from: "",
  to: "",
};

const MetadataDetails = ({ data }: { data: AuditEntry }) => {
  const { t } = useTranslation();
  const entries = Object.entries(data.metadata ?? {}).filter(
    ([k]) => k !== "actor",
  );
  return (
    <div className="px-6 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 text-[12px]">
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.seq")}: </span>
          <span className="font-mono">{data.sequence}</span>
        </div>
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.hash")}: </span>
          <span className="font-mono break-all">{data.hash ?? "—"}</span>
        </div>
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.prevHash")}: </span>
          <span className="font-mono break-all">{data.prevHash ?? "—"}</span>
        </div>
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.entity")}: </span>
          <span className="font-mono break-all">{data.entityId ?? "—"}</span>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="text-[12px] text-[#9a9a9a] italic">
          {t("settings.audit.noDetails")}
        </div>
      ) : (
        <table className="text-[12px]">
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key}>
                <td className="pr-3 py-0.5 align-top font-semibold text-[#535353] whitespace-nowrap">
                  {key}
                </td>
                <td className="py-0.5 align-top font-mono text-[#3C3C3C] break-all">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const AuditLog = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(
    null,
  );

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setCursor(null);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCursor(null);
  };

  const listQuery = useQuery({
    queryKey: ["audit-list", filters, cursor],
    queryFn: () =>
      listAudit({
        entityType: filters.entityType || undefined,
        entityId: filters.entityId || undefined,
        action: filters.action || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        limit: 100,
        cursor: cursor || undefined,
      }),
  });

  const usersQuery = useQuery({ queryKey: ["users-all"], queryFn: getUsers });

  const userById = useMemo(
    () => new Map((usersQuery.data ?? []).map((u) => [u.id, u])),
    [usersQuery.data],
  );

  useEffect(() => {
    if (!listQuery.data) return;
    setItems((prev) =>
      cursor ? [...prev, ...listQuery.data!.items] : listQuery.data!.items,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQuery.data]);

  const verifyMutation = useMutation({
    mutationFn: verifyAudit,
    onSuccess: (data) => setVerifyResult(data),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      exportAuditCsv({
        entityType: filters.entityType || undefined,
        entityId: filters.entityId || undefined,
        action: filters.action || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
  });

  const actorLabel = (entry: AuditEntry): string | null => {
    const actorId = entry.metadata?.actor;
    if (!actorId) return null;
    const u = userById.get(actorId);
    if (!u) return actorId;
    return (
      [u.name, u.surname].filter(Boolean).join(" ") ||
      u.username ||
      u.email ||
      actorId
    );
  };

  const columns = [
    {
      id: "sequence",
      name: t("settings.audit.col.seq"),
      width: "80px",
      cell: (row: AuditEntry) => (
        <span className="font-mono text-[12px]">{row.sequence}</span>
      ),
    },
    {
      id: "when",
      name: t("settings.audit.col.when"),
      width: "170px",
      selector: (row: AuditEntry) =>
        moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      id: "actor",
      name: t("settings.audit.col.actor"),
      width: "160px",
      cell: (row: AuditEntry) => {
        const label = actorLabel(row);
        return label ? (
          <span className="text-[13px] text-[#3C3C3C]">{label}</span>
        ) : (
          <span className="text-[12px] text-[#9a9a9a] italic">
            {t("settings.audit.system")}
          </span>
        );
      },
    },
    {
      id: "entity",
      name: t("settings.audit.col.entity"),
      cell: (row: AuditEntry) => {
        const linkFn = row.entityId ? ENTITY_LINK[row.entityType] : undefined;
        return (
          <div>
            <span className="font-semibold">{row.entityType}</span>
            {linkFn ? (
              <Link
                to={linkFn(row.entityId)}
                className="ml-1 text-[12px] text-[#2B9AE9] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.entityId.slice(0, 8)}…
              </Link>
            ) : (
              <span className="ml-1 text-[12px] text-[#8A8A8A]">
                {row.entityId ? `${row.entityId.slice(0, 8)}…` : "—"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "action",
      name: t("settings.audit.col.action"),
      cell: (row: AuditEntry) => (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white whitespace-nowrap"
          style={{ backgroundColor: actionColor(row.action) }}
        >
          {row.action}
        </span>
      ),
    },
    {
      id: "hash",
      name: t("settings.audit.col.hash"),
      cell: (row: AuditEntry) => (
        <span
          className="font-mono text-[11px] text-[#8A8A8A]"
          title={row.hash ?? ""}
        >
          {row.hash ? `${row.hash.slice(0, 12)}…` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CardHeader text={t("settings.audit.title")} />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="rounded-[8px] border border-[#D0D0D0] px-3 py-1 text-[13px] font-semibold text-[#3C3C3C] hover:bg-[#F5F5F5] disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            {exportMutation.isPending
              ? t("settings.audit.exporting")
              : t("settings.audit.export")}
          </button>
          <button
            type="button"
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            className="rounded-[8px] bg-[#2B9AE9] px-3 py-1 text-[13px] font-semibold text-white hover:bg-[#1E86D2] disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
            {verifyMutation.isPending ? t("settings.audit.verifying") : t("settings.audit.verify")}
          </button>
        </div>
      </div>

      {verifyResult && (
        <div
          className={twMerge(
            "mb-4 flex items-center gap-3 rounded-[10px] px-4 py-3 text-[13px]",
            verifyResult.ok
              ? "bg-[#E7F7E2] text-[#2E7A1A]"
              : "bg-[#FDE2E4] text-[#9B1C1C]",
          )}
        >
          <FontAwesomeIcon
            icon={verifyResult.ok ? faCircleCheck : faCircleExclamation}
          />
          <div>
            {verifyResult.ok ? (
              <span>{t("settings.audit.chainOk", { count: verifyResult.total })}</span>
            ) : (
              <span>
                {t("settings.audit.chainBroken", {
                  seq: verifyResult.firstMismatchSequence,
                  reason: verifyResult.mismatchReason,
                })}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <Input
          label={t("settings.audit.field.entityType")}
          placeholder={t("settings.audit.entityPlaceholder")}
          value={filters.entityType}
          onChange={(e: any) => setFilter("entityType", e.target.value)}
        />
        <Input
          label={t("settings.audit.field.entityId")}
          placeholder={t("settings.audit.entityIdPlaceholder")}
          value={filters.entityId}
          onChange={(e: any) => setFilter("entityId", e.target.value)}
        />
        <Input
          label={t("settings.audit.field.action")}
          placeholder={t("settings.audit.actionPlaceholder")}
          value={filters.action}
          onChange={(e: any) => setFilter("action", e.target.value)}
        />
        <Input
          type="date"
          label={t("settings.audit.field.from")}
          value={filters.from}
          onChange={(e: any) => setFilter("from", e.target.value)}
        />
        <Input
          type="date"
          label={t("settings.audit.field.to")}
          value={filters.to}
          onChange={(e: any) => setFilter("to", e.target.value)}
        />
        <div className="flex items-end pb-2">
          <button
            type="button"
            onClick={clearFilters}
            className="text-[13px] text-[#2B9AE9] hover:underline cursor-pointer"
          >
            <FontAwesomeIcon icon={faFilterCircleXmark} className="mr-1" />
            {t("settings.audit.clearFilters")}
          </button>
        </div>
      </div>

      <MainTable
        columns={columns}
        data={items}
        progressPending={listQuery.isFetching && !cursor}
        expandableRows
        expandableRowsComponent={MetadataDetails}
      />

      {listQuery.data?.nextCursor && (
        <div className="mt-3 flex justify-center">
          <ButtonPrimary
            color="white"
            icon={faRotateRight}
            text={listQuery.isFetching ? t("common.loading2") : t("settings.audit.loadMore")}
            onClick={() => setCursor(listQuery.data?.nextCursor ?? null)}
            disabled={listQuery.isFetching}
          />
        </div>
      )}
    </div>
  );
};

export default AuditLog;
