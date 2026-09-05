import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { faMagnifyingGlass, faSpinner } from "@fortawesome/free-solid-svg-icons";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import Input from "./Input";
import { createPinIcon } from "../../Helpers/leafletPin";

const pinIcon = createPinIcon();

export type Coordinates = { lat: number; lng: number };

const DEFAULT_CENTER: [number, number] = [51.505, -0.09];

type Props = {
  value: Coordinates | null;
  onChange: (coords: Coordinates | null) => void;
  height?: string;
};

const ClickHandler = ({ onPick }: { onPick: (coords: Coordinates) => void }) => {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

// MapContainer's `center` prop only applies on mount, so recenter imperatively
// whenever an address search (or click) moves the pin.
const RecenterMap = ({ position }: { position: Coordinates | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.lat, position?.lng]);
  return null;
};

const AddressMapPicker = ({ value, onChange, height = "380px" }: Props) => {
  const { t } = useTranslation();
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address.trim())}`,
      );
      const results = await res.json();
      const hit = results?.[0];
      if (!hit) {
        setSearchError(t("settings.locations.addressNotFound"));
        return;
      }
      onChange({ lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) });
    } catch {
      setSearchError(t("settings.locations.addressNotFound"));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <form
        className="flex gap-2 items-end mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <div className="flex-1">
          <Input
            label={t("settings.locations.addressSearch")}
            value={address}
            handleChange={setAddress}
            placeholder={t("settings.locations.addressSearchPlaceholder")}
            className="pt-0"
          />
        </div>
        <ButtonPrimary
          type="submit"
          icon={searching ? faSpinner : faMagnifyingGlass}
          text={t("settings.locations.searchAddress")}
          disabled={searching || !address.trim()}
          className="h-[42px]"
        />
      </form>
      {searchError && <div className="text-[13px] text-[#F3606E] mb-2">{searchError}</div>}
      <div className="w-full rounded-[8px] overflow-hidden" style={{ height }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? 15 : 3}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <RecenterMap position={value} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default AddressMapPicker;
