function GraphNode({ data }) {
  return (
    <div className="min-w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-xl">
      <p className="font-medium text-[var(--text-primary)]">
        {data.name}
      </p>

      <p className="mt-1 font-mono text-[10px] tracking-[0.02em] text-[var(--text-secondary)]">
        {data.label}
      </p>
    </div>
  );
}

export default GraphNode;