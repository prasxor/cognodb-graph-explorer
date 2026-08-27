import DeveloperCard from "./DeveloperCard";

function DeveloperList({
  developers,
  selectedDeveloper,
  onSelect,
}) {
  if (!developers.length) {
    return (
      <p className="px-3 text-sm text-[var(--text-secondary)]">
        No developers found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {developers.map((developer) => (
        <DeveloperCard
          key={developer.id}
          developer={developer}
          active={developer.id === selectedDeveloper}
          onClick={() => onSelect(developer)}
        />
      ))}
    </div>
  );
}

export default DeveloperList;