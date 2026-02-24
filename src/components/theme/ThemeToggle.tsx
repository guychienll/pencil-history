"use client";

import { useTheme } from "./ThemeProvider";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: "light" as const, label: "Light", icon: "☀️" },
    { value: "dark" as const, label: "Dark", icon: "🌙" },
    { value: "system" as const, label: "System", icon: "💻" },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-all duration-200 cursor-pointer"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <span className="text-lg" aria-hidden="true">
          {resolvedTheme === "dark" ? "🌙" : "☀️"}
        </span>
        <span className="text-sm font-medium hidden sm:inline">Theme</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              {themes.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setTheme(item.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    theme === item.value
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-surface-hover"
                  }`}
                  aria-label={`Switch to ${item.label} theme`}
                >
                  <span className="text-lg" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {theme === item.value && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Info text */}
            <div className="px-4 py-2 border-t border-border bg-background-tertiary">
              <p className="text-xs text-foreground-tertiary">
                {theme === "system"
                  ? `Following system (${resolvedTheme})`
                  : `${currentTheme.label} mode active`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
