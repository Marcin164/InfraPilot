import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../../../Hooks/useDebounce";

export type ComboboxOption = {
  value: string;
  label: string;
  detail?: string;
};

type Props = {
  placeholder: string;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  fetchOptions: (search: string) => Promise<ComboboxOption[]>;
  queryKey: string;
};

const SearchCombobox = ({
  placeholder,
  value,
  onChange,
  fetchOptions,
  queryKey,
}: Props) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(text, 300);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!value) {
      setText("");
      setOptions([]);
    }
  }, [value]);

  useEffect(() => {
    if (debounced.length < 2) {
      setOptions([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetchOptions(debounced)
      .then((opts) => {
        if (!controller.signal.aborted) {
          setOptions(opts);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setOptions([]);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debounced, queryKey]);

  const pick = (opt: ComboboxOption) => {
    setText(opt.label);
    onChange(opt.value);
    setOpen(false);
  };

  const clear = () => {
    setText("");
    onChange(undefined);
    setOptions([]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center">
        <input
          type="text"
          className="w-full rounded-[10px] border border-[#3C3C3C] px-3 py-[10px] text-[14px] font-semibold outline-none focus:border-[#2B9AE9]"
          placeholder={placeholder}
          value={text}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (e.target.value === "") clear();
          }}
        />
        {value && (
          <button
            type="button"
            className="-ml-8 text-[#8A8A8A] hover:text-[#3C3C3C] cursor-pointer"
            onClick={clear}
          >
            &times;
          </button>
        )}
      </div>
      {open && (options.length > 0 || loading) && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-[10px] border border-[#3C3C3C] bg-white shadow-lg text-[14px]">
          {loading && options.length === 0 && (
            <li className="px-3 py-2 text-[#8A8A8A]">Searching…</li>
          )}
          {options.map((opt) => (
            <li
              key={opt.value}
              className="px-3 py-2 hover:bg-[#D7EEFF]/50 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(opt);
              }}
            >
              <div className="font-semibold text-[#3C3C3C]">{opt.label}</div>
              {opt.detail && (
                <div className="text-[12px] text-[#8A8A8A]">{opt.detail}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchCombobox;
