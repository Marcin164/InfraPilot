import { useEffect, useState } from "react";
import { fetchLocationPlanBlob, type Location } from "../../Services/locations";

const PIN_SVG = (
  <>
    <path
      d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27c0-8.284-6.716-15-15-15z"
      fill="#2B9AE9"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    <circle cx="15" cy="15" r="5.5" fill="#FFFFFF" />
  </>
);

type Props = {
  /** The location (must be a "floor") whose plan image to show. */
  planLocation: Location | undefined;
  x: number | null | undefined;
  y: number | null | undefined;
  onChange: (x: number | null, y: number | null) => void;
  editable?: boolean;
  noLocationHint: string;
  noPlanHint: string;
  clickHint?: string;
};

const PlanPinPicker = ({
  planLocation,
  x,
  y,
  onChange,
  editable = true,
  noLocationHint,
  noPlanHint,
  clickHint,
}: Props) => {
  const [planUrl, setPlanUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!planLocation?.planPath) {
      setPlanUrl(null);
      return;
    }
    let revoked = false;
    fetchLocationPlanBlob(planLocation.id)
      .then((url) => {
        if (revoked) URL.revokeObjectURL(url);
        else setPlanUrl(url);
      })
      .catch(() => {});
    return () => {
      revoked = true;
      setPlanUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [planLocation?.id, planLocation?.planPath]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onChange(nx, ny);
  };

  if (!planLocation) {
    return <div className="text-[13px] text-[#9a9a9a]">{noLocationHint}</div>;
  }
  if (!planLocation.planPath) {
    return <div className="text-[13px] text-[#9a9a9a]">{noPlanHint}</div>;
  }

  return (
    <>
      {editable && clickHint && (
        <div className="text-[12px] text-[#9a9a9a] mb-2">{clickHint}</div>
      )}
      <div
        className={`relative inline-block max-w-full border border-[#F0F0F0] rounded-[8px] overflow-hidden ${
          editable ? "cursor-crosshair" : ""
        }`}
        onClick={handleClick}
      >
        {planUrl && (
          <img
            src={planUrl}
            alt={planLocation.name}
            className="block max-w-full select-none"
            draggable={false}
          />
        )}
        {x != null && y != null && (
          <svg
            width="30"
            height="42"
            viewBox="0 0 30 42"
            className="absolute pointer-events-none"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {PIN_SVG}
          </svg>
        )}
      </div>
    </>
  );
};

export default PlanPinPicker;
