import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import GraphCanvas from "../components/graph/GraphCanvas";
import DetailPanel from "../components/layout/DetailPanel";
import useGraph from "../hooks/useGraph";

function GraphExplorer() {
  const [isDark, setIsDark] = useState(true);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);

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

  // Sync focusedNode with selectedDeveloper when graph changes
  useEffect(() => {
    if (selectedDeveloper && graph?.nodes?.length > 0) {
      const devNode = graph.nodes.find((n) => n.id === selectedDeveloper.id);
      if (devNode) {
        setFocusedNode(devNode);
      }
    }
  }, [selectedDeveloper, graph]);

  const handleDeveloperSelect = async (developer) => {
    setSelectedDeveloper(developer);
    await loadGraph(developer.id);
  };

  const handleNodeSelect = async (node) => {
    if (node.label === "Developer") {
      const developer = developers.find((item) => item.id === node.id);
      if (developer) {
        setSelectedDeveloper(developer);
        await loadGraph(developer.id);
      }
    } else {
      setFocusedNode(node);
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

        "--accent": isDark ? "#0A84FF" : "#007AFF",

        "--graph-dot": isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",

        "--graph-line": isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.08)",

        "--graph-line-muted": isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.03)",
      }}
    >
      <div className="h-dvh flex flex-col overflow-hidden bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300">
        <Header
          isDark={isDark}
          onThemeToggle={() =>
            setIsDark((value) => !value)
          }
        />

        <section className="flex flex-1 min-h-0 overflow-hidden relative">
          <Sidebar
            developers={developers}
            selectedDeveloper={selectedDeveloper?.id}
            onDeveloperSelect={handleDeveloperSelect}
          />

          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden p-2 sm:p-3 flex flex-row">
            <div className="relative flex-1 h-full min-w-0 overflow-hidden">
              <GraphCanvas
                data={graph}
                selectedNodeId={focusedNode?.id}
                onNodeSelect={handleNodeSelect}
              />

              {loading && (
                <div className="pointer-events-none absolute right-6 top-6 z-30 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-2 text-xs text-[var(--text-secondary)] shadow-lg backdrop-blur-xl animate-pulse">
                  Loading graph...
                </div>
              )}

              {error && (
                <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-red-500/20 bg-[var(--surface)] px-4 py-3 text-sm text-red-400 shadow-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Desktop Detail Panel */}
            <AnimatePresence mode="wait">
              {focusedNode && (
                <DetailPanel
                  key={focusedNode.id}
                  node={focusedNode}
                  graphData={graph}
                  onClose={() => setFocusedNode(null)}
                  onNodeFocus={handleNodeSelect}
                />
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}

export default GraphExplorer;