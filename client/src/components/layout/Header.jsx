import { Moon, Sun } from "lucide-react";
import Button from "../ui/Button";

function Header({ onThemeToggle, isDark }) {
  return (
    <header
      className={[
        "flex h-16 items-center justify-between px-6",
        "border-b backdrop-blur-xl transition-colors duration-300",
        "border-[var(--border)] bg-[var(--surface)]/90",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-sm font-semibold shadow-sm transition-colors duration-300",
            "bg-[var(--border)] text-[var(--text-primary)]",
          ].join(" ")}
        >
          C
        </div>

        <span
          className={[
            "text-sm font-semibold tracking-tight transition-colors duration-300",
            "text-[var(--text-primary)]",
          ].join(" ")}
        >
          Cognodb Graph Explorer
        </span>
      </div>

      {/* Theme */}
      <Button
        variant="ghost"
        onClick={onThemeToggle}
        aria-label={
          isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
        title={
          isDark
            ? "Light mode"
            : "Dark mode"
        }
        className={[
          "flex h-10 w-10 items-center justify-center",
          "rounded-full p-0 transition-colors duration-300",
          "text-[var(--text-primary)] hover:bg-[var(--border)]/50",
        ].join(" ")}
      >
        {isDark ? (
          <Sun
            size={18}
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : (
          <Moon
            size={18}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </Button>
    </header>
  );
}

export default Header;