import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modals/AnimatedModal";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import AddressMapPicker, { type Coordinates } from "./AddressMapPicker";

export type { Coordinates };

type Props = {
  label?: string;
  value: Coordinates | null;
  onChange: (coords: Coordinates | null) => void;
  className?: string;
};

const CoordinatesPicker = ({ label, value, onChange, className = "" }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Coordinates | null>(value);

  const openModal = () => {
    setPending(value);
    setOpen(true);
  };

  return (
    <div className={className}>
      {label && (
        <label className="font-bold text-[#3C3C3C] block mb-[6px]">{label}</label>
      )}
      <button
        type="button"
        onClick={openModal}
        className="w-full h-[42px] flex items-center gap-2 border border-[#535353] bg-white rounded-[10px] px-3 text-[14px] font-bold text-[#3C3C3C]"
      >
        <FontAwesomeIcon icon={faLocationDot} className="text-[#2B9AE9]" />
        {value
          ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : t("settings.locations.pickCoordinates")}
      </button>

      <Modal
        classNames={{ modal: "w-[600px] max-w-full h-fit rounded-[10px]" }}
        open={open}
        onClose={() => setOpen(false)}
        center
      >
        <div className="font-bold text-[18px] mb-3">
          {t("settings.locations.pickCoordinates")}
        </div>
        {open && <AddressMapPicker value={pending} onChange={setPending} />}
        <div className="flex justify-between items-center mt-3">
          <button
            type="button"
            onClick={() => setPending(null)}
            className="text-[#9a9a9a] text-[13px] underline"
          >
            {t("common.clear")}
          </button>
          <div className="flex gap-2">
            <ButtonPrimary color="white" text={t("common.cancel")} onClick={() => setOpen(false)} />
            <ButtonPrimary
              text={t("common.save")}
              onClick={() => {
                onChange(pending);
                setOpen(false);
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoordinatesPicker;
