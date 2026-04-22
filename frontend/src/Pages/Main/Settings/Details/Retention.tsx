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
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import Checkbox from "../../../../Components/Inputs/Checkbox";
import MainTable from "../../../../Components/Tables/MainTable";

const ACTIONS: RetentionAction[] = ["purge", "archive"];
const ACTION_OPTIONS = ACTIONS.map((a) => ({ value: a, label: a }));

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
    retry: false,
  });

  const supportedError = supportedQuery.error as any;
  const supportedStatus = supportedError?.response?.status;
  const supportedMessage =
    supportedError?.response?.data?.message ?? supportedError?.message;
  const supportedItems = supportedQuery.data ?? [];
  const entityOptions = supportedItems.map((t) => ({ value: t, label: t }));

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

  const policyColumns = [
    {
      id: "entity",
      name: "Entity",
      selector: (p: RetentionPolicy) => p.entityType,
      cell: (p: RetentionPolicy) => (
        <span className="font-bold text-[#3C3C3C]">{p.entityType}</span>
      ),
      grow: 2,
    },
    {
      id: "days",
      name: "Days",
      width: "110px",
      cell: (p: RetentionPolicy) => (
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
      ),
    },
    {
      id: "action",
      name: "Action",
      width: "130px",
      cell: (p: RetentionPolicy) => (
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
      ),
    },
    {
      id: "enabled",
      name: "Enabled",
      width: "100px",
      center: true,
      cell: (p: RetentionPolicy) => (
        <Checkbox
          id={`enabled-${p.id}`}
          checked={p.enabled}
          handleChange={(checked: boolean) =>
            updateMutation.mutate({
              id: p.id,
              patch: { enabled: checked },
            })
          }
          label={null}
        />
      ),
    },
    {
      id: "lastRun",
      name: "Last run",
      width: "180px",
      cell: (p: RetentionPolicy) => (
        <span className="text-[12px] text-[#7a7a7a]">
          {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      id: "affected",
      name: "Affected",
      width: "100px",
      selector: (p: RetentionPolicy) => p.lastRunAffected,
    },
    {
      id: "actions",
      name: "",
      width: "120px",
      right: true,
      cell: (p: RetentionPolicy) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => runMutation.mutate(p.id)}
            title="Run now"
            className="text-[#2B9AE9] cursor-pointer"
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
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <CardHeader text="Retention policies" icon={faShield} />
      <p className="text-[14px] text-[#7a7a7a] mt-2">
        Purge or archive records older than N days. <strong>SystemAuditLog</strong> is append-only and cannot be configured.
      </p>

      {supportedError && (
        <div className="mt-3 rounded-[8px] bg-[#FDE2E4] text-[#9B1C1C] text-[13px] px-3 py-2">
          Couldn't load entity list
          {supportedStatus ? ` (HTTP ${supportedStatus})` : ""}:{" "}
          {supportedStatus === 403
            ? "your account lacks the Admin or Compliance role required to manage retention."
            : supportedMessage ?? "unknown error"}
        </div>
      )}
      {!supportedError && !supportedQuery.isLoading && supportedItems.length === 0 && (
        <div className="mt-3 rounded-[8px] bg-[#FFF4D6] text-[#8A6500] text-[13px] px-3 py-2">
          Backend returned no supported entity types. Check the retention service whitelist.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <SelectSecondary
          label="Entity"
          options={entityOptions}
          value={entityOptions.find((o) => o.value === entityType) ?? null}
          onSelect={(opt: any) => setEntityType(opt?.value ?? "")}
          isClearable
        />
        <Input
          label="Days"
          type="number"
          value={String(days)}
          onChange={(e: any) => setDays(parseInt(e.target.value) || 1)}
        />
        <SelectSecondary
          label="Action"
          options={ACTION_OPTIONS}
          value={ACTION_OPTIONS.find((o) => o.value === action) ?? null}
          onSelect={(opt: any) => setAction((opt?.value ?? "purge") as RetentionAction)}
        />
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

      <div className="mt-6">
        <MainTable
          columns={policyColumns}
          data={policiesQuery.data ?? []}
          progressPending={policiesQuery.isFetching}
        />
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

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
          <label className="font-bold text-[#3C3C3C] block mb-2">Include</label>
          <div className="flex gap-4 items-center h-[42px]">
            {(["audit", "reports", "tickets"] as EvidenceInclude[]).map((k) => (
              <Checkbox
                key={k}
                id={`include-${k}`}
                label={k}
                checked={include.has(k)}
                handleChange={() => toggle(k)}
              />
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
