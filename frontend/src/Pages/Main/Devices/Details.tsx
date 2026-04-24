import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import DeviceNavbar from "../../../Components/Navbar/DeviceNavbar";
import { Outlet, useParams, useNavigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  downloadDeviceReportPdf,
  getDevice,
} from "../../../Services/devices";
import { useParser } from "../../../Hooks/useParser";
import DataLoader from "../../../Components/Loaders/DataLoader";
import ButtonPrimary from "../../../Components/Buttons/ButtonPrimary";

type Props = {};

const Details = () => {
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
      return downloadDeviceReportPdf(d.id, `lanventory-${slug}.pdf`);
    },
    onSuccess: () => toast.success("PDF downloaded"),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "PDF export failed"),
  });

  if (deviceQuery.isLoading) return <DataLoader />;

  return (
    <div className="w-full p-4">
      <div className="flex items-center justify-between gap-2">
        <DeviceNavbar />
        <ButtonPrimary
          icon={faFilePdf}
          text={pdfMutation.isPending ? "Exporting…" : "Export PDF"}
          onClick={() => pdfMutation.mutate()}
          disabled={pdfMutation.isPending || !deviceQuery.data}
        />
      </div>
      <div className="py-4 w-full">
        <Outlet context={deviceQuery} />
      </div>
    </div>
  );
};

export default Details;
