import { Link } from "react-router";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faMinus,
  faMouse,
  faPlus,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import type { HistoryEntry } from "../../../../Types";
import { historyTypeAccent, historyTypeLabel } from "../constants";

type Props = { entry: HistoryEntry };

const HistoryFeedItem = ({ entry }: Props) => {
  const accent = historyTypeAccent[entry.type] ?? "#535353";
  const label = historyTypeLabel(entry.type);

  const device: any = (entry as any).device;
  const user: any = (entry as any).user;
  const components: any[] = (entry as any).components ?? [];

  return (
    <motion.div
      className="relative rounded-[10px] bg-white p-4 shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div
        className="absolute left-0 top-4 bottom-4 w-[4px] rounded-r-[4px]"
        style={{ backgroundColor: accent }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pl-3">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            {label}
          </span>
          {entry.ticket && (
            <Link
              to={`/admin/helpdesk/${entry.ticket}`}
              className="text-[14px] font-bold text-[#2B9AE9] hover:underline"
            >
              Ticket {entry.ticket}
            </Link>
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#8A8A8A]">
          {entry.date}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 pl-3 text-[14px]">
        {user && (
          <Link
            to={`/admin/users/${user.id}`}
            className="flex items-center gap-2 rounded-[8px] bg-[#F0F6FC] px-3 py-1 text-[#2B9AE9] hover:underline"
          >
            <FontAwesomeIcon icon={faUser} />
            <span className="font-semibold">
              {user.distinguishedName ||
                `${user.name ?? ""} ${user.surname ?? ""}`.trim() ||
                "Unknown user"}
            </span>
          </Link>
        )}

        {user && device && (
          <FontAwesomeIcon icon={faArrowRight} className="text-[#8A8A8A]" />
        )}

        {device && (
          <Link
            to={`/admin/devices/${device.id ?? entry.deviceId}/system`}
            className="flex items-center gap-2 rounded-[8px] bg-[#F0F6FC] px-3 py-1 text-[#2B9AE9] hover:underline"
          >
            <FontAwesomeIcon icon={faMouse} />
            <span className="font-semibold">
              {device.assetName ||
                `${device.manufacturer ?? ""} ${device.model ?? ""}`.trim() ||
                device.serialNumber ||
                "Device"}
            </span>
            {device.serialNumber && (
              <span className="text-[12px] font-normal text-[#535353]">
                · {device.serialNumber}
              </span>
            )}
          </Link>
        )}
      </div>

      {components.length > 0 && (
        <div className="mt-3 space-y-1 pl-3">
          {components.map((component: any) => (
            <div key={component.id} className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={component.type === "remove" ? faMinus : faPlus}
                className={
                  component.type === "remove"
                    ? "text-[#BC0E0E]"
                    : "text-[#30A712]"
                }
              />
              <span className="text-[#535353]">
                {[component.manufacturer, component.model, component.serialNumber]
                  .filter(Boolean)
                  .join(" ")}
              </span>
              {component.subgroup && (
                <span className="rounded-[6px] bg-[#2B9AE9] px-2 py-[2px] text-[12px] font-bold text-white">
                  {component.subgroup}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {entry.details && (
        <div className="mt-3 pl-3">
          <div className="text-[13px] font-bold text-[#535353]">Details</div>
          <div className="text-[14px] italic text-[#3C3C3C]">
            {entry.details}
          </div>
        </div>
      )}

      {entry.justification && (
        <div className="mt-2 pl-3">
          <div className="text-[13px] font-bold text-[#535353]">
            Justification
          </div>
          <div className="text-[14px] italic text-[#3C3C3C]">
            {entry.justification}
          </div>
        </div>
      )}

      {entry.approvers && entry.approvers.length > 0 && (
        <div className="mt-2 pl-3">
          <div className="text-[13px] font-bold text-[#535353]">Approvers</div>
          <div className="flex flex-wrap gap-x-2 text-[14px] italic text-[#3C3C3C]">
            {entry.approvers.map((approver: any, index: number) => (
              <span key={approver?.user?.id ?? index}>
                {approver?.user && (
                  <Link
                    to={`/admin/users/${approver.user.id}`}
                    className="hover:underline"
                  >
                    {approver.user.distinguishedName}
                  </Link>
                )}
                {index !== entry.approvers!.length - 1 && (
                  <span className="px-1">&bull;</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HistoryFeedItem;
