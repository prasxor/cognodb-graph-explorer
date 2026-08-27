import Button from "../ui/Button";

function Header({ onThemeToggle, isDark }) {
  return (
    <header className="flex h-16 items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)] text-sm font-semibold">
          C
        </div>

        <span className="text-sm font-medium">Cognodb</span>
      </div>

      <button
        type="button"
        className="rounded-lg bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text-secondary)] transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <span className="mr-2">⌘K</span>
        Search
      </button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onThemeToggle}>
          {isDark ? "Light" : "Dark"}
        </Button>

        <Button variant="primary">Explore</Button>
      </div>
    </header>
  );
}

export default Header;