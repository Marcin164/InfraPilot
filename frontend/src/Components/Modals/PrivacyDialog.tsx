import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";

import Modal from "./AnimatedModal";
import CardHeader from "../Headers/CardHeader";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import MainTable from "../Tables/MainTable";
import {
  getPersonalData,
  listPrivacyAccessLog,
  exportUserDsar,
  eraseUser,
  listLegalHolds,
  createLegalHold,
  releaseLegalHold,
  PersonalData,
  ErasureResult,
  LegalHold,
} from "../../Services/privacy";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userLabel?: string;
};

const accessLogColumns = [
  {
    id: "when",
    name: "When",
    selector: (row: any) => moment(row.createdAt).format("DD.MM.YYYY HH:mm:ss"),
    width: "180px",
  },
  {
    id: "actor",
    name: "Actor",
    selector: (row: any) => row.metadata?.actor ?? "—",
  },
  {
    id: "action",
    name: "Action",
    selector: (row: any) => row.action,
    width: "160px",
  },
  {
    id: "fields",
    name: "Fields / details",
    cell: (row: any) => (
      <span className="text-[12px] text-[#7a7a7a]">
        {row.metadata?.fields?.join(", ") ??
          row.metadata?.reason ??
          row.metadata?.requestId ??
          "—"}
      </span>
    ),
    grow: 2,
  },
];

const buildHoldsColumns = (onRelease: (hold: LegalHold) => void) => [
  {
    id: "reason",
    name: "Reason",
    selector: (row: LegalHold) => row.reason,
    grow: 2,
  },
  {
    id: "basis",
    name: "Legal basis",
    selector: (row: LegalHold) => row.legalBasis ?? "—",
  },
  {
    id: "retainUntil",
    name: "Retain until",
    selector: (row: LegalHold) =>
      row.retainUntil ? moment(row.retainUntil).format("DD.MM.YYYY") : "∞",
    width: "130px",
  },
  {
    id: "status",
    name: "Status",
    cell: (row: LegalHold) =>
      row.releasedAt ? (
        <span className="text-[12px] text-[#7a7a7a]">
          released {moment(row.releasedAt).format("DD.MM.YYYY")}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onRelease(row)}
          className="text-[12px] font-bold text-[#F3606E] hover:underline cursor-pointer"
        >
          release →
        </button>
      ),
    width: "150px",
  },
];

const PrivacyDialog = ({ isOpen, onClose, userId, userLabel }: Props) => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<PersonalData | null>(null);
  const [eraseReason, setEraseReason] = useState("");
  const [eraseResult, setEraseResult] = useState<ErasureResult | null>(null);

  const [holdReason, setHoldReason] = useState("");
  const [holdBasis, setHoldBasis] = useState("");
  const [holdRetainUntil, setHoldRetainUntil] = useState("");

  const accessLogQuery = useQuery({
    queryKey: ["privacy-access-log", userId],
    queryFn: () =>
      listPrivacyAccessLog({ targetUserId: userId, limit: 50 }),
    enabled: isOpen && Boolean(userId),
  });

  const holdsQuery = useQuery({
    queryKey: ["legal-holds", userId],
    queryFn: () => listLegalHolds({ userId }),
    enabled: isOpen && Boolean(userId),
  });

  const activeHoldCount = (holdsQuery.data ?? []).filter(
    (h) => !h.releasedAt,
  ).length;

  const fetchMutation = useMutation({
    mutationFn: () => getPersonalData(userId),
    onSuccess: (d) => {
      setData(d);
      accessLogQuery.refetch();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to fetch data"),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportUserDsar(userId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dsar-${userId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      accessLogQuery.refetch();
      toast.success("DSAR export downloaded");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Export failed"),
  });

  const createHoldMutation = useMutation({
    mutationFn: () =>
      createLegalHold({
        userId,
        reason: holdReason.trim(),
        legalBasis: holdBasis.trim() || undefined,
        retainUntil: holdRetainUntil || undefined,
      }),
    onSuccess: () => {
      setHoldReason("");
      setHoldBasis("");
      setHoldRetainUntil("");
      holdsQuery.refetch();
      toast.success("Legal hold created");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to create hold"),
  });

  const releaseHoldMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      releaseLegalHold(id, reason),
    onSuccess: () => {
      holdsQuery.refetch();
      toast.success("Legal hold released");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to release hold"),
  });

  const handleReleaseHold = (hold: LegalHold) => {
    const reason = window.prompt(
      `Release legal hold "${hold.reason}"?\nEnter release reason (required, logged):`,
    );
    if (!reason?.trim()) return;
    releaseHoldMutation.mutate({ id: hold.id, reason: reason.trim() });
  };

  const eraseMutation = useMutation({
    mutationFn: () => eraseUser(userId, eraseReason.trim()),
    onSuccess: (res) => {
      setEraseResult(res);
      setData(null);
      accessLogQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["users-roles-table"] });
      queryClient.invalidateQueries({ queryKey: ["users-all"] });
      toast.success("User erased");
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      if (resp?.activeHolds?.length) {
        toast.error(
          `Blocked by ${resp.activeHolds.length} active legal hold(s). Release them first.`,
        );
      } else {
        toast.error(resp?.message ?? "Erasure failed");
      }
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setEraseResult(null);
      setEraseReason("");
    }
  }, [isOpen]);

  const confirmErase = () => {
    if (!eraseReason.trim()) {
      toast.error("Reason is required for erasure");
      return;
    }
    if (
      !window.confirm(
        `Erase (anonymize) personal data for ${userLabel ?? userId}?\n\nThis is irreversible. Audit trail will be preserved.`,
      )
    )
      return;
    eraseMutation.mutate();
  };

  return (
    <Modal
      classNames={{
        modal: "w-[820px] rounded-[10px] max-h-[90vh] overflow-y-auto",
      }}
      open={isOpen}
      onClose={onClose}
      center
    >
      <CardHeader text="DPO — personal data (DSAR)" icon={faUserShield} />
      <p className="text-[13px] text-[#7a7a7a] mt-2">
        Every read, export and erasure is written to{" "}
        <code>PrivacyRecord</code> in the tamper-evident audit chain.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ButtonPrimary
          text={
            fetchMutation.isPending
              ? "Loading…"
              : data
              ? "Re-fetch personal data"
              : "Fetch personal data"
          }
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending || !userId}
        />
        <ButtonPrimary
          text={
            exportMutation.isPending
              ? "Exporting…"
              : "Export all data (Art. 15)"
          }
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || !userId}
        />
        {userLabel && (
          <span className="ml-auto text-[12px] text-[#7a7a7a]">
            Target: <span className="font-bold text-[#3C3C3C]">{userLabel}</span>
          </span>
        )}
      </div>

      {data && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px]">
          {Object.entries(data).map(([k, v]) => (
            <div
              key={k}
              className="border border-[#F0F0F0] rounded-[6px] px-3 py-2"
            >
              <div className="text-[11px] text-[#9a9a9a]">{k}</div>
              <div className="font-bold text-[#3C3C3C] break-all">
                {v == null || v === "" ? "—" : String(v)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-[8px] border border-[#F3D3D7] bg-[#FDF5F6] p-3">
        <div className="text-[14px] font-bold text-[#C0392B]">
          Right to erasure (GDPR Art. 17)
        </div>
        <p className="text-[12px] text-[#7a7a7a] mt-1">
          Anonymises PII fields on the user row. Audit log entries referencing
          this user are preserved (Art. 17(3)(b)/(e)).
          {activeHoldCount > 0 && (
            <span className="text-[#C0392B] font-bold">
              {" "}
              {activeHoldCount} active legal hold(s) — erasure will be blocked.
            </span>
          )}
        </p>
        <div className="mt-2 flex flex-col md:flex-row gap-2">
          <input
            type="text"
            value={eraseReason}
            onChange={(e) => setEraseReason(e.target.value)}
            placeholder="Reason (required, written to audit log)"
            className="flex-1 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px] outline-none focus:border-[#C0392B]"
          />
          <ButtonPrimary
            text={eraseMutation.isPending ? "Erasing…" : "Erase user data"}
            onClick={confirmErase}
            disabled={eraseMutation.isPending || activeHoldCount > 0}
          />
        </div>
        {eraseResult && (
          <div className="mt-3 text-[12px]">
            <div className="font-bold">
              Status: {eraseResult.status} · request {eraseResult.requestId}
            </div>
            <div className="mt-1">
              <span className="text-[#7a7a7a]">Fields nulled: </span>
              {eraseResult.fieldsNulled.join(", ") || "—"}
            </div>
            <div className="mt-1">
              <span className="text-[#7a7a7a]">Retained: </span>
              {eraseResult.itemsRetained
                .map((i) => `${i.category} (${i.reason})`)
                .join("; ")}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-[16px] font-semibold text-[#3C3C3C] mb-2">
          Legal holds (retention overrides)
        </div>
        <p className="text-[12px] text-[#7a7a7a] mb-2">
          An active hold blocks erasure regardless of the DSAR request.
          Release it (with a reason, logged to audit) to proceed.
        </p>
        <MainTable
          columns={buildHoldsColumns(handleReleaseHold)}
          data={holdsQuery.data ?? []}
          progressPending={holdsQuery.isFetching}
          noDataComponent={
            <div className="p-4 text-[13px] text-[#7a7a7a]">
              No legal holds on this user.
            </div>
          }
        />

        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="text"
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            placeholder="Reason (required)"
            className="md:col-span-2 h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px] outline-none focus:border-[#2B9AE9]"
          />
          <input
            type="text"
            value={holdBasis}
            onChange={(e) => setHoldBasis(e.target.value)}
            placeholder="Legal basis (optional)"
            className="h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px] outline-none focus:border-[#2B9AE9]"
          />
          <input
            type="date"
            value={holdRetainUntil}
            onChange={(e) => setHoldRetainUntil(e.target.value)}
            className="h-[34px] rounded-[6px] border border-[#D0D0D0] px-3 text-[13px] outline-none focus:border-[#2B9AE9]"
          />
        </div>
        <div className="mt-2">
          <ButtonPrimary
            text={
              createHoldMutation.isPending
                ? "Creating…"
                : "Add legal hold"
            }
            onClick={() => {
              if (!holdReason.trim()) {
                toast.error("Reason is required");
                return;
              }
              createHoldMutation.mutate();
            }}
            disabled={createHoldMutation.isPending || !userId}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[16px] font-semibold text-[#3C3C3C] mb-2">
          Access log for this user
        </div>
        <MainTable
          columns={accessLogColumns}
          data={accessLogQuery.data?.items ?? []}
          progressPending={accessLogQuery.isFetching}
        />
      </div>
    </Modal>
  );
};

export default PrivacyDialog;
