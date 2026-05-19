import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faKey,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { faWindows as faWindowsBrand } from "@fortawesome/free-brands-svg-icons";

import CardHeader from "../../../../Components/Headers/CardHeader";
import { getAgentSetupInfo } from "../../../../Services/devices";

const CopyableBox = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };
  return (
    <div className="relative">
      <pre className="bg-[#1E1E1E] text-[#E6E6E6] text-[12px] rounded-[8px] p-3 overflow-x-auto whitespace-pre">
        {value}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 bg-[#2B9AE9] text-white text-[12px] rounded-[6px] px-3 py-1 cursor-pointer flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faCopy} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

const WindowsAgent = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["agent-setup-info"],
    queryFn: getAgentSetupInfo,
  });

  if (isLoading) {
    return <div className="p-4 text-[#7a7a7a]">Loading...</div>;
  }
  if (isError) {
    return (
      <div className="p-4 bg-white rounded-[10px] shadow-xl">
        <CardHeader text="Windows Agent setup" icon={faTriangleExclamation} />
        <p className="text-[#BC0E0E] mt-2">
          {(error as any)?.response?.data?.message ??
            "You need the Admin role to view agent setup details."}
        </p>
      </div>
    );
  }

  if (data && !data.configured) {
    return (
      <div className="p-4 bg-white rounded-[10px] shadow-xl">
        <CardHeader text="Windows Agent setup" icon={faTriangleExclamation} />
        <div className="mt-3 bg-[#FFFBEB] border border-[#F59E0B] rounded-[8px] p-3 text-[#92400E] text-[14px]">
          {data.message}
        </div>
      </div>
    );
  }

  const info = data as Extract<typeof data, { configured: true }>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text="Windows Agent setup" icon={faWindowsBrand} />
        <p className="text-[14px] text-[#535353] mt-2">
          Install the LanVentory agent on a Windows host to start collecting
          inventory. The agent self-enrolls against this backend -- no manual
          device creation needed. Each scan signs its request with a per-host
          HMAC-SHA256 secret.
        </p>
      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text="Install on a host" icon={faWindowsBrand} />
        <p className="text-[14px] text-[#535353] mt-2 mb-3">
          On the Windows host, open <strong>PowerShell as Administrator</strong>
          {" "}and paste:
        </p>
        <CopyableBox value={info.powershellSnippet} />
        <p className="text-[12px] text-[#7a7a7a] mt-2">
          The snippet downloads the agent installer from this backend and runs
          it silently with your tenant's URL + enrollment token. No further
          prompts on the host.
        </p>
      </div>

      <div className="bg-white rounded-[10px] shadow-xl p-4">
        <CardHeader text="Token rotation" icon={faKey} />
        <p className="text-[14px] text-[#535353] mt-2">
          The enrollment token is fleet-wide bootstrap. If it leaks, rotate{" "}
          <code>AGENT_ENROLLMENT_TOKEN</code> on this backend and restart.
          Already-enrolled hosts keep working (each has its own per-device
          HMAC secret), only fresh installs need the new token.
        </p>
      </div>
    </div>
  );
};

export default WindowsAgent;
