import React, { useState } from "react";
import { Compact, Github, Sketch } from "@uiw/react-color";

type Props = { className: string };

const ColorPicker = ({ className = "" }: Props) => {
  const [hex, setHex] = useState("#e0f");
  return (
    <div className={className}>
      <Github
        style={{ width: "100%", marginTop: "10px" }}
        color={hex}
        onChange={(color) => {
          setHex(color.hex);
        }}
      />
    </div>
  );
};

export default ColorPicker;
