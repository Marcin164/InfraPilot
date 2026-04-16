import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserSettings,
  updateUserSettings,
} from "../Services/settings";
import type { FilterPreset, UserSettings } from "../Types";

const cryptoId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const useFilterPresets = (
  tableKey: string,
  filters: Record<string, any>,
  setFilters: (next: Record<string, any>) => void,
) => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const presets: FilterPreset[] = useMemo(
    () => settingsQuery.data?.filterPresets?.[tableKey] ?? [],
    [settingsQuery.data, tableKey],
  );

  const activePreset = useMemo(
    () => presets.find((p) => p.lastUsed) ?? null,
    [presets],
  );

  const mutation = useMutation({
    mutationFn: (nextPresets: FilterPreset[]) => {
      const current = settingsQuery.data?.filterPresets ?? {};
      const nextSettings: Partial<UserSettings> = {
        filterPresets: { ...current, [tableKey]: nextPresets },
      };
      return updateUserSettings(nextSettings);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["userSettings"], data);
    },
  });

  const writePresets = (nextPresets: FilterPreset[]) => {
    // optimistic update so UI feels instant
    const current = settingsQuery.data;
    if (current) {
      queryClient.setQueryData(["userSettings"], {
        ...current,
        filterPresets: {
          ...(current.filterPresets ?? {}),
          [tableKey]: nextPresets,
        },
      });
    }
    mutation.mutate(nextPresets);
  };

  const savePreset = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const preset: FilterPreset = {
      id: cryptoId(),
      name: trimmed,
      filters,
      lastUsed: true,
    };
    const nextPresets = [
      ...presets.map((p) => ({ ...p, lastUsed: false })),
      preset,
    ];
    writePresets(nextPresets);
  };

  const deletePreset = (id: string) => {
    writePresets(presets.filter((p) => p.id !== id));
  };

  const activatePreset = (id: string) => {
    const target = presets.find((p) => p.id === id);
    if (!target) return;
    setFilters(target.filters);
    writePresets(presets.map((p) => ({ ...p, lastUsed: p.id === id })));
  };

  const clearActive = () => {
    if (!activePreset) return;
    writePresets(presets.map((p) => ({ ...p, lastUsed: false })));
  };

  // auto-apply last used preset once settings load
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current) return;
    if (!settingsQuery.data) return;
    appliedRef.current = true;
    const last = (settingsQuery.data.filterPresets?.[tableKey] ?? []).find(
      (p) => p.lastUsed,
    );
    if (last) setFilters(last.filters);
  }, [settingsQuery.data, tableKey, setFilters]);

  return {
    presets,
    activePreset,
    savePreset,
    deletePreset,
    activatePreset,
    clearActive,
    isLoading: settingsQuery.isLoading,
  };
};
