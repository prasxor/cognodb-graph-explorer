import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import GraphCanvas from "../components/graph/GraphCanvas";
import useGraph from "../hooks/useGraph";

function GraphExplorer() {
  const [isDark, setIsDark] = useState(true);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);

  const {
    developers,
    graph,
    loading,
    error,
    loadDevelopers,
    loadGraph,
  } = useGraph();

  useEffect(() => {
    loadDevelopers();
  }, [loadDevelopers]);

  const handleDeveloperSelect = async (developer) => {
    setSelectedDeveloper(developer);
    await loadGraph(developer.id);
  };

  const handleNodeSelect = (node) => {
    if (node.label !== "Developer") return;

    const developer = developers.find(
      (item) => item.id === node.id,
    );

    if (developer) {
      setSelectedDeveloper(developer);
    }
  };

  return (
    <main
      className={isDark ? "dark" : ""}
      style={{
        "--background": isDark ? "#0A0A0B" : "#F5F5F7",
        "--surface": isDark ? "#141416" : "#FFFFFF",
        "--border": isDark ? "#232326" : "#D2D2D7",

        "--text-primary": isDark
          ? "#F5F5F7"
          : "#1D1D1F",

        "--text-secondary": isDark
          ? "#86868B"
          : "#6E6E73",

        "--accent": "#0A84FF",

        "--graph-dot": isDark
          ? "rgba(255,255,255,0.14)"
          : "rgba(29,29,31,0.16)",

        "--graph-line": isDark
          ? "rgba(255,255,255,0.28)"
          : "rgba(29,29,31,0.22)",

        "--graph-line-muted": isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(29,29,31,0.08)",
      }}
    >
      <div className="h-dvh overflow-hidden bg-[var(--background)] text-[var(--text-primary)]">
        <Header
          isDark={isDark}
          onThemeToggle={() =>
            setIsDark((value) => !value)
          }
        />

        <section className="flex h-[calc(100dvh-64px)] min-h-0 overflow-hidden">
          <Sidebar
            developers={developers}
            selectedDeveloper={selectedDeveloper?.id}
            onDeveloperSelect={handleDeveloperSelect}
          />

          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden p-2 sm:p-3">
            <GraphCanvas
              data={graph}
              selectedNodeId={selectedDeveloper?.id}
              onNodeSelect={handleNodeSelect}
            />

            {loading && (
              <div className="pointer-events-none absolute right-6 top-6 z-30 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-2 text-xs text-[var(--text-secondary)] shadow-lg backdrop-blur-xl">
                Loading graph...
              </div>
            )}

            {error && (
              <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-red-500/20 bg-[var(--surface)] px-4 py-3 text-sm text-red-400 shadow-lg">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default GraphExplorer;