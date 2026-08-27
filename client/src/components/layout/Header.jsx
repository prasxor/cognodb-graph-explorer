import { Moon, Sun } from "lucide-react";
import Button from "../ui/Button";

function Header({ onThemeToggle, isDark }) {
  return (
    <header
      className={[
        "flex h-16 items-center justify-between px-6",
        "border-b backdrop-blur-xl",
        isDark
          ? "border-[#232326] bg-[#141416]/90"
          : "border-[#D9DDE3] bg-[#F8F9FB]/90",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-sm font-semibold shadow-sm",
            isDark
              ? "bg-[#252529] text-[#F5F5F7]"
              : "bg-[#E5E8ED] text-[#17181A]",
          ].join(" ")}
        >
          C
        </div>

        <span
          className={[
            "text-sm font-semibold tracking-tight",
            isDark ? "text-[#F5F5F7]" : "text-[#17181A]",
          ].join(" ")}
        >
          Cognodb
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
          "flex h-12 w-12 items-center justify-center",
          "rounded-full p-0",
          isDark
            ? "text-[#F5F5F7] hover:bg-[#252529]"
            : "text-[#34373C] hover:bg-[#E8EBEF]",
        ].join(" ")}
      >
        {isDark ? (
          <Sun
            size={25}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        ) : (
          <Moon
            size={25}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        )}
      </Button>
    </header>
  );
}

export default Header;