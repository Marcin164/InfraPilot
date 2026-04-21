import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPlay,
  faFileZipper,
  faShield,
} from "@fortawesome/free-solid-svg-icons";

import {
  RetentionAction,
  RetentionPolicy,
  createRetentionPolicy,
  deleteRetentionPolicy,
  listRetentionPolicies,
  listSupportedEntities,
  runRetentionPolicy,
  updateRetentionPolicy,
} from "../../../../Services/retention";
import { downloadEvidencePack, EvidenceInclude } from "../../../../Services/evidence";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";

const ACTIONS: RetentionAction[] = ["purge", "archive"];

const RetentionPoliciesSection = () => {
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState("");
  const [days, setDays] = useState(365);
  const [action, setAction] = useState<RetentionAction>("purge");

  const policiesQuery = useQuery({
    queryKey: ["retention-policies"],
    queryFn: listRetentionPolicies,
  });

  const supportedQuery = useQuery({
    queryKey: ["retention-supported"],
    queryFn: listSupportedEntities,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["retention-policies"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createRetentionPolicy({ entityType, retentionDays: days, action }),
    onSuccess: () => {
      toast.success("Policy created");
      setEntityType("");
      setDays(365);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to create policy"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<RetentionPolicy> }) =>
      updateRetentionPolicy(id, patch),
    onSuccess: () => {
      toast.success("Policy updated");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to update policy"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRetentionPolicy(id),
    onSuccess: () => {
      toast.success("Policy deleted");
      invalidate();
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => runRetentionPolicy(id),
    onSuccess: ({ affected }) => {
      toast.success(`Removed ${affected} record(s)`);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Run failed"),
  });

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text="Retention policies" icon={faShield} />
      <p className="text-[14px] text-[#7a7a7a] mt-2">
        Purge or archive records older than N days. <strong>SystemAuditLog</strong> is append-only and cannot be configured.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-[12px] text-[#535353] block mb-1">Entity</label>
          <select
            className="border border-[#535353] rounded-[8px] h-[40px] w-full px-2"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="">Select…</option>
            {(supportedQuery.data ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Days"
          type="number"
          value={String(days)}
          onChange={(e: any) => setDays(parseInt(e.target.value) || 1)}
        />
        <div>
          <label className="text-[12px] text-[#535353] block mb-1">Action</label>
          <select
            className="border border-[#535353] rounded-[8px] h-[40px] w-full px-2"
            value={action}
            onChange={(e) => setAction(e.target.value as RetentionAction)}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <ButtonPrimary
          icon={faPlus}
          text="Add policy"
          onClick={() => {
            if (!entityType) return toast.error("Pick an entity type");
            createMutation.mutate();
          }}
          disabled={createMutation.isPending}
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left text-[#535353] border-b border-[#E6E6E6]">
              <th className="py-2 pr-4">Entity</th>
              <th className="py-2 pr-4">Days</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Enabled</th>
              <th className="py-2 pr-4">Last run</th>
              <th className="py-2 pr-4">Affected</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {(policiesQuery.data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-[#F0F0F0]">
                <td className="py-2 pr-4 font-bold">{p.entityType}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    defaultValue={p.retentionDays}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      if (value !== p.retentionDays) {
                        updateMutation.mutate({
                          id: p.id,
                          patch: { retentionDays: value },
                        });
                      }
                    }}
                    className="w-20 border border-[#E6E6E6] rounded-[6px] px-2 py-1"
                  />
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={p.action}
                    onChange={(e) =>
                      updateMutation.mutate({
                        id: p.id,
                        patch: { action: e.target.value as RetentionAction },
                      })
                    }
                    className="border border-[#E6E6E6] rounded-[6px] px-2 py-1"
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) =>
                      updateMutation.mutate({
                        id: p.id,
                        patch: { enabled: e.target.checked },
                      })
                    }
                    className="h-4 w-4 cursor-pointer accent-[#2B9AE9]"
                  />
                </td>
                <td className="py-2 pr-4 text-[12px] text-[#7a7a7a]">
                  {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-4">{p.lastRunAffected}</td>
                <td className="py-2 pr-4 text-right">
                  <button
                    type="button"
                    onClick={() => runMutation.mutate(p.id)}
                    title="Run now"
                    className="text-[#2B9AE9] mr-3 cursor-pointer"
                    disabled={runMutation.isPending}
                  >
                    <FontAwesomeIcon icon={faPlay} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete policy for ${p.entityType}?`)) {
                        deleteMutation.mutate(p.id);
                      }
                    }}
                    className="text-[#F3606E] cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
            {!(policiesQuery.data ?? []).length && (
              <tr>
                <td colSpan={7} className="py-4 text-[#9a9a9a] text-center">
                  No policies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EvidencePackSection = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState(today);
  const [include, setInclude] = useState<Set<EvidenceInclude>>(
    new Set(["audit", "reports", "tickets"]),
  );

  const includeArr = useMemo(() => Array.from(include), [include]);

  const buildMutation = useMutation({
    mutationFn: () =>
      downloadEvidencePack({
        from: new Date(from).toISOString(),
        to: new Date(to + "T23:59:59").toISOString(),
        include: includeArr,
      }),
    onSuccess: () => toast.success("Evidence pack downloaded"),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to build pack"),
  });

  const toggle = (key: EvidenceInclude) => {
    setInclude((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text="Evidence pack" icon={faFileZipper} />
      <p className="text-[14px] text-[#7a7a7a] mt-2">
        Bundle audit log, reports (CSV + PDF) and tickets activity into a signed ZIP for an auditor.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="From"
          type="date"
          value={from}
          onChange={(e: any) => setFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={to}
          onChange={(e: any) => setTo(e.target.value)}
        />
        <div>
          <label className="text-[12px] text-[#535353] block mb-1">Include</label>
          <div className="flex gap-3 items-center h-[40px]">
            {(["audit", "reports", "tickets"] as EvidenceInclude[]).map((k) => (
              <label key={k} className="text-[14px] flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={include.has(k)}
                  onChange={() => toggle(k)}
                  className="accent-[#2B9AE9]"
                />
                {k}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ButtonPrimary
          icon={faFileZipper}
          text={buildMutation.isPending ? "Building…" : "Generate pack"}
          onClick={() => buildMutation.mutate()}
          disabled={buildMutation.isPending || includeArr.length === 0}
        />
      </div>
    </div>
  );
};

const Retention = () => {
  return (
    <div className="space-y-4 m-4">
      <RetentionPoliciesSection />
      <EvidencePackSection />
    </div>
  );
};

export default Retention;
