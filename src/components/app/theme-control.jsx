"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

const options = [{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Monitor }];

export function ThemeControl({ compact = false }) {
  const { theme, setTheme } = useTheme();
  return <div className="inline-flex rounded-md border border-line bg-mist p-1" aria-label="Appearance">{options.map(({ value, label, icon: Icon }) => <button key={value} type="button" title={`${label} appearance`} aria-label={`${label} appearance`} aria-pressed={theme === value} onClick={() => setTheme(value)} className={cn("flex h-8 items-center justify-center gap-2 rounded px-2 text-xs font-medium text-ink/60 transition hover:text-ink", theme === value && "bg-surface text-ink shadow-sm")}><Icon className="h-4 w-4" />{!compact && <span>{label}</span>}</button>)}</div>;
}
