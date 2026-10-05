"use client";

import { useEffect, useState } from "react";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";
import { IconMoon, IconSun } from "@/components/icons";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Reads the data-theme attribute the blocking script in layout.tsx
    // already set on <html> before hydration — syncing React state to
    // that external DOM state, which is exactly what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-fill hover:text-ink ${className}`}
    >
      {theme === "dark" ? (
        <IconSun className="h-4 w-4" strokeWidth={1.6} />
      ) : (
        <IconMoon className="h-4 w-4" strokeWidth={1.6} />
      )}
    </button>
  );
}
