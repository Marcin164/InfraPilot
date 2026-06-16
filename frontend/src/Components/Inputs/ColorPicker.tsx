import { useRef } from "react";

type Props = {
  value: string;
  onChange: (color: string) => void;
  onBlur?: () => void;
  size?: number;
};

const ColorPicker = ({ value, onChange, onBlur, size = 44 }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full border-4 border-white shadow-md cursor-pointer transition-transform hover:scale-110 shrink-0"
        style={{ backgroundColor: value, width: size, height: size }}
        aria-label="Pick color"
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="sr-only"
      />
    </div>
  );
};

export default ColorPicker;
