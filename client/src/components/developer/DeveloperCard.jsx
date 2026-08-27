import Badge from "../ui/Badge";
import Card from "../ui/Card";

function DeveloperCard({ developer, active, onClick }) {
  return (
    <Card
      className={`p-3.5 transition-all duration-300 ${
        active
          ? "border-[var(--accent)] bg-[var(--surface)] ring-1.5 ring-[var(--accent)]/20 shadow-md shadow-[var(--accent)]/5"
          : "border-[var(--border)] hover:border-[var(--text-secondary)]/40 bg-[var(--surface)]/80 hover:bg-[var(--surface)] shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)] transition-colors duration-300">
              {developer.name}
            </p>

            <p className="mt-0.5 text-xs text-[var(--text-secondary)] transition-colors duration-300">
              {developer.role}
            </p>
          </div>

          <Badge className="bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)]">
            {developer.projects.length}
          </Badge>
        </div>

        {developer.projects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {developer.projects.map((project) => (
              <Badge
                key={project.id}
                className="bg-[var(--background)]/60 border border-[var(--border)]/70 text-[var(--text-secondary)] text-[9px] py-0.5 px-2"
              >
                {project.name}
              </Badge>
            ))}
          </div>
        )}
      </button>
    </Card>
  );
}

export default DeveloperCard;