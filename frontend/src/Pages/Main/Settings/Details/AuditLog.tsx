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
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { listAudit, verifyAudit, exportAuditCsv } from "../../../../Services/audit";
import type { AuditEntry, AuditVerifyResult } from "../../../../Services/audit";
import { getUsers } from "../../../../Services/users";
import CardHeader from "../../../../Components/Headers/CardHeader";
import MainTable from "../../../../Components/Tables/MainTable";
import Input from "../../../../Components/Inputs/Input";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";

// ── Known entity types and common actions for dropdowns ──────────────────────

const ENTITY_TYPES = [
  "Ticket", "TicketActivity", "TicketComment", "TicketCategory", "TicketWorkflow",
  "Device", "DeviceScan",
  "User",
  "History", "Form",
  "RetentionPolicy",
  "ComplianceRule", "ComplianceResult",
  "AgentTask",
  "SoftwareLicense", "PurchaseOrder",
  "KnowledgeArticle",
  "Notification",
];

const KNOWN_ACTIONS = [
  "created", "updated", "deleted",
  "field_change",
  "archived", "executed",
  "linked", "unlinked",
  "approved", "rejected",
  "enrolled",
  "auto_categorized",
];

const ENTITY_LINK: Record<string, (id: string) => string> = {
  Device: (id) => `/admin/devices/${id}/system`,
  Ticket: (id) => `/admin/helpdesk/${id}`,
  User:   (id) => `/admin/users/${id}`,
  KnowledgeArticle: (id) => `/admin/knowledge`,
};

const actionColor = (action: string) => {
  if (/creat|enrolled|assign|approved/i.test(action)) return "#30A712";
  if (/delet|cancel|revoke|rejected/i.test(action))    return "#F3606E";
  if (/updat|chang|rotat|field_change/i.test(action))  return "#F1C40F";
  if (/archiv/i.test(action))                          return "#9B59B6";
  if (/execut/i.test(action))                          return "#3498DB";
  return "#8A8A8A";
};

// ── Metadata detail panel ────────────────────────────────────────────────────

const FieldDiff = ({ field, oldVal, newVal }: { field: string; oldVal: any; newVal: any }) => (
  <div className="flex flex-wrap items-start gap-1 py-1 border-b border-[#F0F0F0] last:border-0">
    <span className="text-[12px] font-semibold text-[#535353] min-w-[120px]">{field}</span>
    <span className="text-[12px] font-mono text-[#F3606E] line-through break-all">
      {oldVal === null || oldVal === undefined ? "—" : String(oldVal)}
    </span>
    <FontAwesomeIcon icon={faArrowRight} className="text-[#9a9a9a] text-[10px] self-center mx-1 shrink-0" />
    <span className="text-[12px] font-mono text-[#30A712] break-all">
      {newVal === null || newVal === undefined ? "—" : String(newVal)}
    </span>
  </div>
);

const SnapshotRow = ({ label, value }: { label: string; value: any }) => {
  if (value === null || value === undefined) return null;
  const display = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (!display || display === "null") return null;
  return (
    <tr>
      <td className="pr-4 py-0.5 align-top font-semibold text-[#535353] whitespace-nowrap text-[12px]">{label}</td>
      <td className="py-0.5 align-top font-mono text-[#3C3C3C] break-all text-[12px]">{display}</td>
    </tr>
  );
};

const MetadataDetails = ({ data }: { data: AuditEntry }) => {
  const { t } = useTranslation();
  const meta = data.metadata ?? {};

  // field_change — show diff view
  if (data.action === "field_change" && "field" in meta) {
    return (
      <div className="px-6 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0]">
        <div className="text-[11px] font-semibold text-[#9a9a9a] uppercase mb-2">
          {t("settings.audit.diff")}
        </div>
        <FieldDiff field={String(meta.field)} oldVal={meta.oldValue} newVal={meta.newValue} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[#9a9a9a]">
          <span>{t("settings.audit.col.seq")}: <span className="font-mono text-[#3C3C3C]">{data.sequence}</span></span>
          <span>{t("settings.audit.col.hash")}: <span className="font-mono text-[#3C3C3C] break-all">{data.hash?.slice(0, 16) ?? "—"}…</span></span>
        </div>
      </div>
    );
  }

  // archived — show key fields from snapshot
  if (data.action === "archived" && meta.snapshot) {
    const snap = meta.snapshot as Record<string, any>;
    const SNAPSHOT_KEYS = ["id", "title", "name", "assetName", "number", "category", "status", "description", "createdAt"];
    const entries = SNAPSHOT_KEYS.map((k) => [k, snap[k]] as [string, any]).filter(([, v]) => v != null && v !== "");
    return (
      <div className="px-6 py-3 bg-[#F9F3FF] border-t border-[#E0D0F0]">
        <div className="text-[11px] font-semibold text-[#9B59B6] uppercase mb-2">
          {t("settings.audit.snapshotLabel")}
        </div>
        <table className="text-[12px] w-full">
          <tbody>
            {entries.map(([k, v]) => <SnapshotRow key={k} label={k} value={v} />)}
          </tbody>
        </table>
        <div className="mt-2 text-[11px] text-[#9a9a9a]">
          {t("settings.audit.col.seq")}: <span className="font-mono">{data.sequence}</span>
          {" · "}{t("settings.audit.policyId")}: <span className="font-mono">{meta.policyId ?? "—"}</span>
        </div>
      </div>
    );
  }

  // generic metadata table
  const entries = Object.entries(meta).filter(([k]) => k !== "actor");
  return (
    <div className="px-6 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[12px]">
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.seq")}: </span>
          <span className="font-mono">{data.sequence}</span>
        </div>
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.hash")}: </span>
          <span className="font-mono break-all">{data.hash ? `${data.hash.slice(0, 20)}…` : "—"}</span>
        </div>
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.prevHash")}: </span>
          <span className="font-mono break-all">{data.prevHash ? `${data.prevHash.slice(0, 20)}…` : "—"}</span>
        </div>
        <div>
          <span className="text-[#9a9a9a]">{t("settings.audit.col.entity")}: </span>
          <span className="font-mono break-all">{data.entityId ?? "—"}</span>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="text-[12px] text-[#9a9a9a] italic">{t("settings.audit.noDetails")}</div>
      ) : (
        <table className="text-[12px] w-full">
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b border-[#F0F0F0] last:border-0">
                <td className="pr-4 py-0.5 align-top font-semibold text-[#535353] whitespace-nowrap">{key}</td>
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

// ── Main component ────────────────────────────────────────────────────────────

type Filters = {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  entityType: "",
  entityId: "",
  action: "",
  actorId: "",
  from: "",
  to: "",
};

const AuditLog = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);

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
        actorId: filters.actorId || undefined,
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
    return [u.name, u.surname].filter(Boolean).join(" ") || u.username || u.email || actorId;
  };

  // Dropdown options
  const entityTypeOptions = [
    { value: "", label: t("settings.audit.filter.allTypes") },
    ...ENTITY_TYPES.map((v) => ({ value: v, label: v })),
  ];

  const actionOptions = [
    { value: "", label: t("settings.audit.filter.allActions") },
    ...KNOWN_ACTIONS.map((v) => ({ value: v, label: v })),
  ];

  const actorOptions = [
    { value: "", label: t("settings.audit.filter.allActors") },
    ...((usersQuery.data ?? []).map((u) => ({
      value: u.id,
      label: [u.name, u.surname].filter(Boolean).join(" ") || u.username || u.email,
    }))),
  ];

  const columns = [
    {
      id: "when",
      name: t("settings.audit.col.when"),
      width: "155px",
      cell: (row: AuditEntry) => (
        <span className="font-mono text-[12px] text-[#535353]">
          {moment(row.createdAt).format("DD.MM.YYYY HH:mm")}
        </span>
      ),
    },
    {
      id: "actor",
      name: t("settings.audit.col.actor"),
      width: "150px",
      cell: (row: AuditEntry) => {
        const label = actorLabel(row);
        return label ? (
          <span className="text-[13px] font-semibold text-[#3C3C3C]">{label}</span>
        ) : (
          <span className="text-[12px] text-[#9a9a9a] italic">{t("settings.audit.system")}</span>
        );
      },
    },
    {
      id: "entity",
      name: t("settings.audit.col.entity"),
      grow: 2,
      cell: (row: AuditEntry) => {
        const linkFn = row.entityId ? ENTITY_LINK[row.entityType] : undefined;
        return (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="text-[11px] font-semibold uppercase text-[#9a9a9a] tracking-wide">
              {row.entityType}
            </span>
            {row.entityName ? (
              linkFn ? (
                <Link
                  to={linkFn(row.entityId)}
                  className="text-[13px] font-semibold text-[#2B9AE9] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.entityName}
                </Link>
              ) : (
                <span className="text-[13px] font-semibold text-[#3C3C3C]">{row.entityName}</span>
              )
            ) : row.entityId ? (
              linkFn ? (
                <Link
                  to={linkFn(row.entityId)}
                  className="text-[12px] text-[#2B9AE9] hover:underline font-mono"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.entityId.slice(0, 8)}…
                </Link>
              ) : (
                <span className="text-[12px] font-mono text-[#8A8A8A]">{row.entityId.slice(0, 8)}…</span>
              )
            ) : (
              <span className="text-[12px] text-[#9a9a9a]">—</span>
            )}
          </div>
        );
      },
    },
    {
      id: "action",
      name: t("settings.audit.col.action"),
      width: "150px",
      cell: (row: AuditEntry) => (
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white whitespace-nowrap"
          style={{ backgroundColor: actionColor(row.action) }}
        >
          {row.action}
        </span>
      ),
    },
    {
      id: "summary",
      name: t("settings.audit.col.summary"),
      grow: 2,
      cell: (row: AuditEntry) => {
        const meta = row.metadata ?? {};
        if (row.action === "field_change" && meta.field) {
          const oldV = meta.oldValue != null ? String(meta.oldValue) : "—";
          const newV = meta.newValue != null ? String(meta.newValue) : "—";
          return (
            <div className="text-[12px] py-1">
              <span className="font-semibold text-[#535353]">{meta.field}: </span>
              <span className="font-mono text-[#F3606E] line-through">{oldV.slice(0, 30)}</span>
              <FontAwesomeIcon icon={faArrowRight} className="mx-1 text-[#9a9a9a] text-[10px]" />
              <span className="font-mono text-[#30A712]">{newV.slice(0, 30)}</span>
            </div>
          );
        }
        if (row.action === "archived" && meta.policyId) {
          return (
            <span className="text-[12px] text-[#9B59B6]">
              {t("settings.audit.archivedBy")} <span className="font-mono text-[10px]">{String(meta.policyId).slice(0, 8)}…</span>
            </span>
          );
        }
        const entries = Object.entries(meta).filter(([k]) => !["actor", "snapshot"].includes(k));
        if (entries.length === 0) return <span className="text-[12px] text-[#9a9a9a]">—</span>;
        return (
          <div className="text-[12px] text-[#535353] py-1 space-y-0.5">
            {entries.slice(0, 2).map(([k, v]) => (
              <div key={k} className="truncate max-w-[240px]">
                <span className="font-semibold">{k}: </span>
                <span className="font-mono">
                  {typeof v === "object" ? JSON.stringify(v).slice(0, 40) : String(v ?? "—").slice(0, 40)}
                </span>
              </div>
            ))}
            {entries.length > 2 && (
              <div className="text-[#9a9a9a]">+{entries.length - 2} {t("settings.audit.moreFields")}</div>
            )}
          </div>
        );
      },
    },
  ];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="p-6">
      {/* Header */}
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
            {exportMutation.isPending ? t("settings.audit.exporting") : t("settings.audit.export")}
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

      {/* Verify result banner */}
      {verifyResult && (
        <div
          className={twMerge(
            "mb-4 flex items-center gap-3 rounded-[10px] px-4 py-3 text-[13px]",
            verifyResult.ok ? "bg-[#E7F7E2] text-[#2E7A1A]" : "bg-[#FDE2E4] text-[#9B1C1C]",
          )}
        >
          <FontAwesomeIcon icon={verifyResult.ok ? faCircleCheck : faCircleExclamation} />
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

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SelectSecondary
          label={t("settings.audit.field.entityType")}
          options={entityTypeOptions}
          value={entityTypeOptions.find((o) => o.value === filters.entityType) ?? entityTypeOptions[0]}
          onSelect={(opt: any) => setFilter("entityType", opt?.value ?? "")}
        />
        <SelectSecondary
          label={t("settings.audit.field.action")}
          options={actionOptions}
          value={actionOptions.find((o) => o.value === filters.action) ?? actionOptions[0]}
          onSelect={(opt: any) => setFilter("action", opt?.value ?? "")}
        />
        <SelectSecondary
          label={t("settings.audit.field.actor")}
          options={actorOptions}
          value={actorOptions.find((o) => o.value === filters.actorId) ?? actorOptions[0]}
          onSelect={(opt: any) => setFilter("actorId", opt?.value ?? "")}
        />
        <Input
          label={t("settings.audit.field.entityId")}
          placeholder={t("settings.audit.entityIdPlaceholder")}
          value={filters.entityId}
          onChange={(e: any) => setFilter("entityId", e.target.value)}
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
      </div>

      {hasActiveFilters && (
        <div className="mb-3">
          <button
            type="button"
            onClick={clearFilters}
            className="text-[13px] text-[#2B9AE9] hover:underline cursor-pointer"
          >
            <FontAwesomeIcon icon={faFilterCircleXmark} className="mr-1" />
            {t("settings.audit.clearFilters")}
          </button>
        </div>
      )}

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
