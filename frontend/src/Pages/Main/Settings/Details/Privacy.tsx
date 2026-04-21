import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faSearch, faUserShield } from "@fortawesome/free-solid-svg-icons";

import { getPersonalData, listPrivacyAccessLog, PersonalData } from "../../../../Services/privacy";
import { getUsers } from "../../../../Services/users";
import CardHeader from "../../../../Components/Headers/CardHeader";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import Input from "../../../../Components/Inputs/Input";
import type { User } from "../../../../Types";

const Privacy = () => {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [data, setData] = useState<PersonalData | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users-all"],
    queryFn: getUsers,
  });

  const accessLogQuery = useQuery({
    queryKey: ["privacy-access-log", selectedUserId],
    queryFn: () =>
      listPrivacyAccessLog({
        targetUserId: selectedUserId ?? undefined,
        limit: 100,
      }),
    enabled: true,
  });

  const fetchMutation = useMutation({
    mutationFn: (id: string) => getPersonalData(id),
    onSuccess: (d) => {
      setData(d);
      accessLogQuery.refetch();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to fetch data"),
  });

  const filtered = (usersQuery.data ?? []).filter((u: User) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [u.name, u.surname, u.email]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term));
  });

  return (
    <div className="space-y-4 m-4">
      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="DPO — personal data lookup" icon={faUserShield} />
        <p className="text-[14px] text-[#7a7a7a] mt-2">
          Every read is recorded in the audit log under <code>PrivacyRecord:read</code>.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Search user"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
          <div>
            <label className="text-[12px] text-[#535353] block mb-1">User</label>
            <select
              className="border border-[#535353] rounded-[8px] h-[40px] w-full px-2"
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
            >
              <option value="">Select…</option>
              {filtered.slice(0, 100).map((u: User) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.surname} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="self-end">
            <ButtonPrimary
              icon={faSearch}
              text={fetchMutation.isPending ? "Loading…" : "Fetch personal data"}
              onClick={() => selectedUserId && fetchMutation.mutate(selectedUserId)}
              disabled={!selectedUserId || fetchMutation.isPending}
            />
          </div>
        </div>

        {data && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
            {Object.entries(data).map(([k, v]) => (
              <div key={k} className="border border-[#F0F0F0] rounded-[6px] px-3 py-2">
                <div className="text-[12px] text-[#9a9a9a]">{k}</div>
                <div className="font-bold text-[#3C3C3C] break-all">
                  {v == null ? "—" : String(v)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow-xl rounded-[10px] p-4">
        <CardHeader text="Access log" icon={faUserShield} />
        <p className="text-[14px] text-[#7a7a7a] mt-2">
          Recent reads of personal data{selectedUserId ? " for the selected user" : ""}.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[#535353] border-b border-[#E6E6E6]">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">Target</th>
                <th className="py-2 pr-4">Fields</th>
              </tr>
            </thead>
            <tbody>
              {(accessLogQuery.data?.items ?? []).map((row) => (
                <tr key={row.id} className="border-b border-[#F0F0F0]">
                  <td className="py-2 pr-4 text-[12px] text-[#7a7a7a]">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{row.metadata?.actor ?? "—"}</td>
                  <td className="py-2 pr-4">{row.entityId}</td>
                  <td className="py-2 pr-4 text-[12px] text-[#7a7a7a]">
                    {(row.metadata?.fields ?? []).join(", ")}
                  </td>
                </tr>
              ))}
              {!(accessLogQuery.data?.items ?? []).length && (
                <tr>
                  <td colSpan={4} className="py-4 text-[#9a9a9a] text-center">
                    No access entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
