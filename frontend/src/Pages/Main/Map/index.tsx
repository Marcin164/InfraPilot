import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getLocations } from "../../../Services/locations";
import { createPinIcon } from "../../../Helpers/leafletPin";
import BuildingPopupContent from "./BuildingPopupContent";

const locationIcon = createPinIcon();

const DEFAULT_POSITION: [number, number] = [51.505, -0.09];

const Map = () => {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const located = (query.data ?? []).filter(
    (l) => l.latitude != null && l.longitude != null,
  );

  const center: [number, number] = located.length
    ? [located[0].latitude as number, located[0].longitude as number]
    : DEFAULT_POSITION;

  return (
    <div className="h-full w-full relative">
      {!query.isLoading && located.length === 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-xl rounded-[8px] px-4 py-2 text-[13px] text-[#7a7a7a]">
          {t("map.empty")}
        </div>
      )}
      <MapContainer center={center} zoom={located.length ? 6 : 3} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude as number, loc.longitude as number]}
            icon={locationIcon}
          >
            <Popup minWidth={240}>
              <div className="font-bold text-[15px]" style={{ color: "#3C3C3C" }}>
                {loc.name}
              </div>
              {loc.description && (
                <div className="text-[12px] mt-0.5" style={{ color: "#7a7a7a" }}>
                  {loc.description}
                </div>
              )}
              <BuildingPopupContent locationId={loc.id} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map;
