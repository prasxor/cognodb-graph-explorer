import DeveloperList from "../developer/DeveloperList";

function Sidebar({
  developers,
  selectedDeveloper,
  onDeveloperSelect,
}) {
  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto px-6 py-8 md:block">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Schema
        </p>

        <h2 className="mt-2 text-lg font-semibold">
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