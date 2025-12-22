import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoon,
  faSun,
  faDesktop,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import ButtonSecondary from "../../../../Components/Buttons/ButtonSecondary";
import SelectSecondary from "../../../../Components/Inputs/SelectSecondary";
import Checkbox from "../../../../Components/Inputs/Checkbox";

const Personal = () => {
  const [theme, setTheme] = useState("system"); // day | night | system
  const [language, setLanguage] = useState("pl"); // pl | en
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState({
    history: true,
    devices: true,
    users: false,
  });

  const options = [
    {
      value: "pl",
      label: "Polski",
    },
    {
      value: "en",
      label: "English",
    },
  ];

  const toggleNotificationOption = (key: any) => {
    setNotifications((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="bg-white shadow-xl rounded-[10px] p-4 m-4 space-y-6">
      {/* THEME */}
      <div>
        <h3 className="font-semibold mb-2">Theme</h3>
        <div className="flex gap-2">
          <ButtonSecondary
            onClick={() => setTheme("day")}
            text="Day"
            icon={faSun}
          />
          <ButtonSecondary
            onClick={() => setTheme("night")}
            text="Night"
            icon={faMoon}
          />
          <ButtonSecondary
            onClick={() => setTheme("system")}
            text="System"
            icon={faDesktop}
          />
        </div>
      </div>
      <div>
        <SelectSecondary
          options={options}
          label="Language"
          onSelect={(e: any) => setLanguage(e.target.value)}
          className="w-[300px]"
        />
      </div>
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          Notifications
        </h3>
        <Checkbox
          label="User changes"
          checked={notificationsEnabled}
          onChange={() => setNotificationsEnabled((v) => !v)}
          className="pb-2"
        />
        {notificationsEnabled && (
          <div className="ml-4 space-y-2">
            <Checkbox label="History changes" onChange={() => {}} />
            <Checkbox label="Device changes" />
            <Checkbox label="User changes" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Personal;
