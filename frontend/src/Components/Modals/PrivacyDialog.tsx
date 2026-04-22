import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  PersonalData,
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
    id: "fields",
    name: "Fields read",
    cell: (row: any) => (
      <span className="text-[12px] text-[#7a7a7a]">
        {(row.metadata?.fields ?? []).join(", ") || "—"}
      </span>
    ),
    grow: 2,
  },
];

const PrivacyDialog = ({ isOpen, onClose, userId, userLabel }: Props) => {
  const [data, setData] = useState<PersonalData | null>(null);

  const accessLogQuery = useQuery({
    queryKey: ["privacy-access-log", userId],
    queryFn: () =>
      listPrivacyAccessLog({ targetUserId: userId, limit: 50 }),
    enabled: isOpen && Boolean(userId),
  });

  const fetchMutation = useMutation({
    mutationFn: () => getPersonalData(userId),
    onSuccess: (d) => {
      setData(d);
      accessLogQuery.refetch();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to fetch data"),
  });

  useEffect(() => {
    if (!isOpen) setData(null);
  }, [isOpen]);

  return (
    <Modal
      classNames={{
        modal: "w-[720px] rounded-[10px] max-h-[85vh] overflow-y-auto",
      }}
      open={isOpen}
      onClose={onClose}
      center
    >
      <CardHeader text="DPO — personal data lookup" icon={faUserShield} />
      <p className="text-[13px] text-[#7a7a7a] mt-2">
        Every read of personal data is written to <code>PrivacyRecord:read</code>{" "}
        with a tamper-evident hash. Viewing this dialog does not yet log access —
        only clicking <em>Fetch</em> does.
      </p>

      <div className="mt-4 flex items-center gap-3">
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
        {userLabel && (
          <span className="text-[12px] text-[#7a7a7a]">
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
