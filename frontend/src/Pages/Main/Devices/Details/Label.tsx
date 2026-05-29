import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faQrcode } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";

declare const QRCode: any;

async function generateQR(canvas: HTMLCanvasElement, text: string) {
  try {
    // Dynamic import so we don't block if the package isn't installed yet
    const QR = await import("qrcode");
    await QR.toCanvas(canvas, text, {
      width: 120,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    // Fallback: draw placeholder
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = 120;
      canvas.height = 120;
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, 120, 120);
      ctx.fillStyle = "#9a9a9a";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("QR unavailable", 60, 60);
      ctx.fillText("npm install qrcode", 60, 75);
    }
  }
}

const LabelCard = ({ device }: { device: any }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const assetName = device?.assetName ?? "—";
  const serialNumber = device?.serialNumber ?? "—";
  const model = device?.model ?? "—";
  const manufacturer = device?.manufacturer ?? "—";
  const id = device?.id ?? "";

  const qrContent = `${window.location.origin}/admin/devices/${id}`;

  useEffect(() => {
    if (canvasRef.current && id) {
      generateQR(canvasRef.current, qrContent);
    }
  }, [id, qrContent]);

  return (
    <div
      id="device-label"
      className="bg-white border border-[#3C3C3C] rounded-[6px] p-3 flex gap-3 items-start"
      style={{ width: 340, fontFamily: "monospace" }}
    >
      <canvas ref={canvasRef} style={{ width: 90, height: 90, flexShrink: 0 }} />
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-bold text-[15px] text-[#3C3C3C] truncate">{assetName}</div>
        <div className="text-[11px] text-[#555] mt-0.5">
          {manufacturer} {model}
        </div>
        <div className="text-[10px] text-[#777] mt-1">S/N: {serialNumber}</div>
        <div
          className="text-[8px] text-[#aaa] mt-1 break-all"
          style={{ wordBreak: "break-all" }}
        >
          {id}
        </div>
        <div className="text-[8px] text-[#aaa] mt-0.5">LanVentory</div>
      </div>
    </div>
  );
};

const Label = () => {
  const { t } = useTranslation();
  const deviceQuery: any = useOutletContext();
  const data = deviceQuery?.data ?? {};

  const handlePrint = () => {
    const el = document.getElementById("device-label");
    if (!el) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label – ${data.assetName ?? data.id}</title>
          <style>
            @page { size: 90mm 45mm; margin: 3mm; }
            body { margin: 0; padding: 0; font-family: monospace; }
            #device-label {
              border: 1px solid #000;
              padding: 4px;
              display: flex;
              gap: 8px;
              align-items: flex-start;
              width: 100%;
              box-sizing: border-box;
            }
            canvas { width: 80px; height: 80px; flex-shrink: 0; }
            .info { flex: 1; overflow: hidden; }
            .name { font-weight: bold; font-size: 13px; }
            .sub { font-size: 9px; color: #555; margin-top: 2px; }
            .id { font-size: 7px; color: #aaa; word-break: break-all; }
          </style>
        </head>
        <body>${el.outerHTML}</body>
      </html>`;

    const win = window.open("", "_blank", "width=600,height=400");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 font-semibold text-[20px] text-[#3C3C3C]">
          <FontAwesomeIcon icon={faQrcode} className="text-[#2B9AE9]" />
          {t("device.label.title")}
        </div>
        <ButtonPrimary
          icon={faPrint}
          text={t("device.label.print")}
          onClick={handlePrint}
        />
      </div>

      <div className="flex flex-col gap-3">
        <LabelCard device={data} />

        <div className="text-[12px] text-[#9a9a9a]">
          {t("device.label.hint")}
        </div>
      </div>
    </div>
  );
};

export default Label;
