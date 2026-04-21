import { useState } from "react";
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
import type { AuditVerifyResult } from "../../../../Services/audit";
import CardHeader from "../../../../Components/Headers/CardHeader";

const AuditLog = () => {
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
        limit: 100,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyAudit,
    onSuccess: (data) => setVerifyResult(data),
  });

  const items = listQuery.data?.items ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <CardHeader text="Audit log" />
        <button
          type="button"
          onClick={() => verifyMutation.mutate()}
          disabled={verifyMutation.isPending}
          className="ml-auto rounded-[8px] bg-[#2B9AE9] px-3 py-1 text-[13px] font-semibold text-white hover:bg-[#1E86D2] disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
          {verifyMutation.isPending ? "Verifying…" : "Verify chain"}
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
              <span>Chain OK — {verifyResult.total} records verified.</span>
            ) : (
              <span>
                Chain broken at sequence {verifyResult.firstMismatchSequence}:{" "}
                {verifyResult.mismatchReason}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <input
          className="rounded-[8px] border border-[#E8E8E8] bg-white px-3 py-2 text-[13px]"
          placeholder="Entity type (Ticket, History, …)"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
        <input
          className="rounded-[8px] border border-[#E8E8E8] bg-white px-3 py-2 text-[13px]"
          placeholder="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-[10px] bg-white shadow-xl">
        <table className="w-full text-[13px]">
          <thead className="bg-[#F6F6F6] text-[12px] uppercase text-[#8A8A8A]">
            <tr>
              <th className="px-4 py-2 text-left">Seq</th>
              <th className="px-4 py-2 text-left">When</th>
              <th className="px-4 py-2 text-left">Entity</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Hash</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]"
              >
                <td className="px-4 py-2 font-mono text-[12px]">
                  {row.sequence}
                </td>
                <td className="px-4 py-2">
                  {moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                </td>
                <td className="px-4 py-2">
                  <span className="font-semibold">{row.entityType}</span>
                  <span className="ml-1 text-[#8A8A8A]">
                    {row.entityId.slice(0, 8)}…
                  </span>
                </td>
                <td className="px-4 py-2">{row.action}</td>
                <td
                  className="px-4 py-2 font-mono text-[11px] text-[#8A8A8A]"
                  title={row.hash ?? ""}
                >
                  {row.hash ? `${row.hash.slice(0, 12)}…` : "—"}
                </td>
              </tr>
            ))}
            {items.length === 0 && !listQuery.isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[#8A8A8A]"
                >
                  No audit entries match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
