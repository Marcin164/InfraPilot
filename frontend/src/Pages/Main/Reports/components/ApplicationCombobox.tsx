import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../../../../Hooks/useDebounce";
import { searchApplications } from "../../../../Services/applications";

type Props = {
  value?: string;
  onChange: (next: string | undefined) => void;
};

const inputCls =
  "border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-56";

const ApplicationCombobox = ({ value, onChange }: Props) => {
  const [text, setText] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(text, 300);

  // close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // sync external value -> local
  useEffect(() => {
    if (value !== undefined && value !== text) setText(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { data } = useQuery({
    queryKey: ["applications", "search", debounced],
    queryFn: () => searchApplications(debounced),
    enabled: debounced.length >= 2,
    staleTime: 60 * 1000,
  });

  const pick = (name: string) => {
    setText(name);
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className={inputCls}
        placeholder="Type to search…"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (e.target.value === "") onChange(undefined);
        }}
        onBlur={() => {
          // commit current text on blur even if user didn't pick from list
          if (text) onChange(text);
        }}
      />
      {open && data && data.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm">
          {data.map((row) => (
            <li
              key={row.name}
              className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(row.name);
              }}
            >
              {row.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ApplicationCombobox;
