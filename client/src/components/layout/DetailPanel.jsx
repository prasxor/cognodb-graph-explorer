import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Briefcase,
  Cpu,
  ArrowUpRight,
} from "lucide-react";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    const update = () => {
      setMatches(media.matches);
    };

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, [query]);

  return matches;
}

const TYPE_CONFIG = {
  Developer: {
    icon: User,
    label: "Developer",
  },
  Project: {
    icon: Briefcase,
    label: "Project",
  },
  Technology: {
    icon: Cpu,
    label: "Technology",
  },
};

function DetailPanel({
  node,
  graphData,
  onClose,
  onNodeFocus,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!node || !graphData) {
    return null;
  }

  const { id, label, name } = node;

  const nodes = graphData.nodes ?? [];
  const relationships = graphData.relationships ?? [];

  const findNodes = (predicate) =>
    relationships
      .filter(predicate)
      .map((relationship) => {
        const targetId =
          relationship.source === id
            ? relationship.target
            : relationship.source;

        return nodes.find((item) => item.id === targetId);
      })
      .filter(Boolean);

  let sections = [];
  let metadata = null;

  if (label === "Developer") {
    const projects = relationships
      .filter(
        (relationship) =>
          relationship.type === "WORKS_ON" &&
          relationship.source === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.target)
      )
      .filter(Boolean);

    const technologies = relationships
      .filter(
        (relationship) =>
          relationship.type === "KNOWS" &&
          relationship.source === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.target)
      )
      .filter(Boolean);

    const collaborators = relationships
      .filter(
        (relationship) =>
          relationship.type === "COLLABORATES_WITH" &&
          (relationship.source === id ||
            relationship.target === id)
      )
      .map((relationship) => {
        const otherId =
          relationship.source === id
            ? relationship.target
            : relationship.source;

        return nodes.find((item) => item.id === otherId);
      })
      .filter(Boolean);

    metadata = {
      label: "Role",
      value: node.role ?? "Software Engineer",
    };

    sections = [
      {
        title: "Works On",
        nodes: projects,
      },
      {
        title: "Knows",
        nodes: technologies,
      },
      {
        title: "Collaborates With",
        nodes: collaborators,
      },
    ];
  }

  if (label === "Project") {
    const developers = relationships
      .filter(
        (relationship) =>
          relationship.type === "WORKS_ON" &&
          relationship.target === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.source)
      )
      .filter(Boolean);

    const technologies = relationships
      .filter(
        (relationship) =>
          relationship.type === "USES" &&
          relationship.source === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.target)
      )
      .filter(Boolean);

    const dependsOn = relationships
      .filter(
        (relationship) =>
          relationship.type === "DEPENDS_ON" &&
          relationship.source === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.target)
      )
      .filter(Boolean);

    const dependedOnBy = relationships
      .filter(
        (relationship) =>
          relationship.type === "DEPENDS_ON" &&
          relationship.target === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.source)
      )
      .filter(Boolean);

    metadata = {
      label: "Status",
      value: node.status ?? "Active",
    };

    sections = [
      {
        title: "Developers",
        nodes: developers,
      },
      {
        title: "Technologies",
        nodes: technologies,
      },
      {
        title: "Depends On",
        nodes: dependsOn,
      },
      {
        title: "Depended On By",
        nodes: dependedOnBy,
      },
    ];
  }

  if (label === "Technology") {
    const developers = relationships
      .filter(
        (relationship) =>
          relationship.type === "KNOWS" &&
          relationship.target === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.source)
      )
      .filter(Boolean);

    const projects = relationships
      .filter(
        (relationship) =>
          relationship.type === "USES" &&
          relationship.target === id
      )
      .map((relationship) =>
        nodes.find((item) => item.id === relationship.source)
      )
      .filter(Boolean);

    metadata = {
      label: "Category",
      value: node.category ?? "Software",
    };

    sections = [
      {
        title: "Known By Developers",
        nodes: developers,
      },
      {
        title: "Used In Projects",
        nodes: projects,
      },
    ];
  }

  const config = TYPE_CONFIG[label] ?? TYPE_CONFIG.Developer;
  const Icon = config.icon;

  const transition = {
    type: "tween",
    ease: [0.32, 0.72, 0, 1],
    duration: 0.42,
  };

  const variants = isMobile
    ? {
        initial: {
          y: "100%",
          opacity: 0,
        },
        animate: {
          y: 0,
          opacity: 1,
        },
        exit: {
          y: "100%",
          opacity: 0,
        },
      }
    : {
        initial: {
          x: "100%",
          opacity: 0,
        },
        animate: {
          x: 0,
          opacity: 1,
        },
        exit: {
          x: "100%",
          opacity: 0,
        },
      };

  return (
    <motion.aside
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className={[
        "flex shrink-0 flex-col ml-3 h-full",
        "border-[var(--border)]",
        "bg-[var(--surface)]",
        "text-[var(--text-primary)]",
        "shadow-2xl",
        "backdrop-blur-xl",
        "transition-colors duration-300" ,
        isMobile
          ? [
              "fixed inset-x-0 bottom-0 z-50",
              "max-h-[85dvh]",
              "rounded-t-2xl",
              "border-t",
            ].join(" ")
          : [
              "h-full w-[340px]",
              "border-l",
            ].join(" "),
      ].join(" ")}
      aria-label={`${label} details`}
    >
      {/* Mobile drag indicator */}
      {isMobile && (
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <Icon
              size={14}
              strokeWidth={1.8}
              className="text-[var(--text-secondary)]"
            />
          </div>

          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {config.label} Details
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center",
            "rounded-lg",
            "border border-transparent",
            "text-[var(--text-secondary)]",
            "transition",
            "hover:border-[var(--border)]",
            "hover:bg-[var(--background)]",
            "hover:text-[var(--text-primary)]",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-[var(--accent)]/40",
            "cursor-pointer",
          ].join(" ")}
        >
          <X size={16} />
        </button>
      </header>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-7 px-5 py-6">

          {/* Identity */}
          <section>
            <span className="mb-2 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              {label}
            </span>

            <h2 className="mt-3 break-words text-[24px] font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)]">
              {name}
            </h2>

            {metadata && (
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-3.5 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  {metadata.label}
                </p>

                <p className="mt-1.5 text-sm font-medium capitalize text-[var(--text-primary)]">
                  {metadata.value}
                </p>
              </div>
            )}
          </section>

          {/* Relationships */}
          <section className="space-y-6">
            {sections.map((section) => {
              if (!section.nodes.length) {
                return null;
              }

              return (
                <RelationshipSection
                  key={section.title}
                  title={section.title}
                  nodes={section.nodes}
                  onNodeFocus={onNodeFocus}
                />
              );
            })}
          </section>

          {/* Empty state */}
          {sections.every(
            (section) => section.nodes.length === 0
          ) && (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                No connections found
              </p>

              <p className="mt-1 text-xs text-[var(--text-secondary)]/70">
                This node has no connected records in the current graph.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function RelationshipSection({
  title,
  nodes,
  onNodeFocus,
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
          {title}
        </h3>

        <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-1.5 text-[9px] font-medium text-[var(--text-secondary)]">
          {nodes.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {nodes.map((connectedNode) => (
          <button
            key={connectedNode.id}
            type="button"
            onClick={() => onNodeFocus(connectedNode)}
            className={[
              "group flex w-full items-center justify-between gap-3",
              "rounded-xl",
              "border border-[var(--border)]",
              "bg-[var(--background)]/45",
              "px-3.5 py-3",
              "text-left",
              "transition-all duration-200",
              "hover:border-[var(--accent)]/30",
              "hover:bg-[var(--background)]",
              "focus:outline-none",
              "focus:ring-2",
              "focus:ring-[var(--accent)]/30",
              "cursor-pointer",
            ].join(" ")}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {connectedNode.name}
              </p>

              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                {connectedNode.label}
              </p>
            </div>

            <ArrowUpRight
              size={15}
              strokeWidth={1.8}
              className={[
                "shrink-0",
                "text-[var(--text-secondary)]",
                "opacity-50",
                "transition-all duration-200",
                "group-hover:translate-x-0.5",
                "group-hover:-translate-y-0.5",
                "group-hover:opacity-100",
                "group-hover:text-[var(--accent)]",
              ].join(" ")}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default DetailPanel;