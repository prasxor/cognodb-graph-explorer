import Badge from "../ui/Badge";
import Card from "../ui/Card";

function DeveloperCard({ developer, active, onClick }) {
  return (
    <Card
      className={`p-4 transition-all duration-200 ${
        active
          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
          : "hover:border-[var(--text-secondary)]"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer text-left focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{developer.name}</p>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {developer.role}
            </p>
          </div>

          <Badge className="bg-[var(--background)] text-[var(--text-secondary)]">
            {developer.projects.length}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {developer.projects.map((project) => (
            <Badge
              key={project.id}
              className="bg-[var(--background)] text-[var(--text-secondary)]"
            >
              {project.name}
            </Badge>
          ))}
        </div>
      </button>
    </Card>
  );
}

export default DeveloperCard;