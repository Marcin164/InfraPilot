import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import moment from "moment";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faCircleCheck,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { listAudit, verifyAudit } from "../../../../Services/audit";
import type { AuditEntry, AuditVerifyResult } from "../../../../Services/audit";
import CardHeader from "../../../../Components/Headers/CardHeader";
import MainTable from "../../../../Components/Tables/MainTable";
import Input from "../../../../Components/Inputs/Input";

const AuditLog = () => {
  const { t } = useTranslation();
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(
    null,
  );

  const listQuery = useQuery({
    queryKey: ["audit-list", entityType, action],
    queryFn: () =>
      listAudit({
        entityType: entityType || undefined,
        action: action || undefined,
        limit: 200,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyAudit,
    onSuccess: (data) => setVerifyResult(data),
  });

  const items = listQuery.data?.items ?? [];

  const columns = [
    {
      id: "sequence",
      name: t("settings.audit.col.seq"),
      width: "90px",
      cell: (row: AuditEntry) => (
        <span className="font-mono text-[12px]">{row.sequence}</span>
      ),
    },
    {
      id: "when",
      name: t("settings.audit.col.when"),
      width: "180px",
      selector: (row: AuditEntry) =>
        moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      id: "entity",
      name: t("settings.audit.col.entity"),
      cell: (row: AuditEntry) => (
        <div>
          <span className="font-semibold">{row.entityType}</span>
          <span className="ml-1 text-[12px] text-[#8A8A8A]">
            {row.entityId.slice(0, 8)}…
          </span>
        </div>
      ),
    },
    {
      id: "action",
      name: t("settings.audit.col.action"),
      selector: (row: AuditEntry) => row.action,
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
        <button
          type="button"
          onClick={() => verifyMutation.mutate()}
          disabled={verifyMutation.isPending}
          className="ml-auto rounded-[8px] bg-[#2B9AE9] px-3 py-1 text-[13px] font-semibold text-white hover:bg-[#1E86D2] disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
          {verifyMutation.isPending ? t("settings.audit.verifying") : t("settings.audit.verify")}
        </button>
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

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[600px]">
        <Input
          label={t("settings.audit.field.entityType")}
          placeholder={t("settings.audit.entityPlaceholder")}
          value={entityType}
          onChange={(e: any) => setEntityType(e.target.value)}
        />
        <Input
          label={t("settings.audit.field.action")}
          placeholder={t("settings.audit.actionPlaceholder")}
          value={action}
          onChange={(e: any) => setAction(e.target.value)}
        />
      </div>

      <MainTable
        columns={columns}
        data={items}
        progressPending={listQuery.isFetching}
      />
    </div>
  );
};

export default AuditLog;
