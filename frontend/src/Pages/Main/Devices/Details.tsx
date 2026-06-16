import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import DeviceNavbar from "../../../Components/Navbar/DeviceNavbar";
import { Outlet, useParams, useNavigate, useLocation } from "react-router";
import {
  downloadDeviceReportPdf,
  getDevice,
} from "../../../Services/devices";
import { useParser } from "../../../Hooks/useParser";
import DataLoader from "../../../Components/Loaders/DataLoader";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";

const Details = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setParsers } = useParser();

  const deviceQuery = useQuery({
    queryKey: ["device"],
    queryFn: () => getDevice(params.id!),
  });

  useEffect(() => {
    if (deviceQuery?.data?.id) {
      setParsers({ [deviceQuery.data.id]: deviceQuery.data.assetName ?? deviceQuery.data.id });
    }
    return () => setParsers({});
  }, [deviceQuery?.data?.id, setParsers]);

  useEffect(() => {
    if (location.pathname === `/admin/devices/${deviceQuery?.data?.id}`)
      navigate("system");
  }, [location.pathname]);

  const pdfMutation = useMutation({
    mutationFn: () => {
      const d = deviceQuery.data;
      if (!d?.id) throw new Error("Device not loaded");
      const slug =
        d.assetName?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || d.id;
      return downloadDeviceReportPdf(d.id, `infrapilot-${slug}.pdf`);
    },
    onSuccess: () => toast.success(t("device.export.success")),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? t("device.export.error")),
  });

  if (deviceQuery.isLoading) return <DataLoader />;

  return (
    <div className="w-full p-4">
      {/* ── Navbar + PDF button: side by side on sm+, stacked on mobile ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <DeviceNavbar />
        </div>
        <ButtonPrimary
          icon={faFilePdf}
          text={pdfMutation.isPending ? t("device.export.exporting") : t("device.export.pdf")}
          onClick={() => pdfMutation.mutate()}
          disabled={pdfMutation.isPending || !deviceQuery.data}
          className="flex-shrink-0 self-end sm:self-auto"
        />
      </div>
      <div className="py-4 w-full">
        <Outlet context={deviceQuery} />
      </div>
    </div>
  );
};

export default Details;
