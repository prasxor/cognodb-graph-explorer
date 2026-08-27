import DeveloperList from "../developer/DeveloperList";

function Sidebar({
  developers,
  selectedDeveloper,
  onDeveloperSelect,
}) {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)]/30 px-6 py-8 md:block transition-colors duration-300">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Schema
        </p>

        <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)]">
          Developers
        </h2>
      </div>

      <div className="mt-6">
        <DeveloperList
          developers={developers}
          selectedDeveloper={selectedDeveloper}
          onSelect={onDeveloperSelect}
        />
      </div>
    </aside>
  );
}

export default Sidebar;