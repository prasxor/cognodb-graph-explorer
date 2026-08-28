import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3.5;

function getNodeSize(node) {
  const name = String(node?.name ?? "Node");
  // Calculate dynamic width based on name length
  const titleWidth = name.length * 8 + 48;
  const width = Math.min(280, Math.max(190, titleWidth));
  return {
    width,
    height: 132,
  };
}

function getNodeLabel(label) {
  return String(label ?? "Node").toUpperCase();
}

function getEdgePoint(from, to, width, height) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === 0) {
    return { x: from.x, y: from.y };
  }

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const scaleX =
    Math.abs(dx) > 0 ? halfWidth / Math.abs(dx) : Number.POSITIVE_INFINITY;
  const scaleY =
    Math.abs(dy) > 0 ? halfHeight / Math.abs(dy) : Number.POSITIVE_INFINITY;

  const scale = Math.min(scaleX, scaleY);

  return {
    x: from.x + dx * scale,
    y: from.y + dy * scale,
  };
}

function getCurve(source, target, sourceSize, targetSize, index) {
  // Offset target size slightly to make arrowheads touch the boundary cleanly
  const start = getEdgePoint(
    source,
    target,
    sourceSize.width,
    sourceSize.height,
  );
  const end = getEdgePoint(
    target,
    source,
    targetSize.width + 12,
    targetSize.height + 12,
  );

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

  const normalX = -dy / distance;
  const normalY = dx / distance;

  // Restrained curve layout
  const curveAmount = Math.min(100, Math.max(25, distance * 0.12));
  const direction = index % 2 === 0 ? 1 : -1;

  const control = {
    x: (start.x + end.x) / 2 + normalX * curveAmount * direction,
    y: (start.y + end.y) / 2 + normalY * curveAmount * direction,
  };

  const midpoint = {
    x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
    y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
  };

  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
    midpoint,
  };
}

function getPointerDistance(a, b) {
  const dx = b.clientX - a.clientX;
  const dy = b.clientY - a.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPointerCenter(a, b) {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

function GraphCanvas({ data, selectedNodeId, onNodeSelect }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const pointersRef = useRef(new Map());

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [pinchDistance, setPinchDistance] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const nodes = data?.nodes ?? [];
  const relationships = data?.relationships ?? [];

  // Track container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Monitor prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Default layout centered in the current dimensions
  const defaultPositions = useMemo(() => {
    const result = {};
    if (!nodes.length) return result;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const selected = selectedNodeId
      ? nodes.find((node) => node.id === selectedNodeId)
      : null;

    const others = nodes.filter((node) => node.id !== selectedNodeId);

    // Keep the focused node in the visual center.
    if (selected) {
      result[selected.id] = {
        x: centerX,
        y: centerY,
      };
    }

    if (!others.length) return result;

    /*
     * Use a collision-resistant ring around the selected node.
     *
     * The previous layout used a relatively small elliptical radius,
     * which caused the cards to stack on top of each other when the
     * graph was first loaded or a developer was selected.
     */
    const count = others.length;

    const nodeWidth = 190;
    const nodeHeight = 132;
    const horizontalGap = 70;
    const verticalGap = 55;

    const minRadiusX =
      (nodeWidth + horizontalGap) / (2 * Math.sin(Math.PI / count));

    const minRadiusY =
      (nodeHeight + verticalGap) / (2 * Math.sin(Math.PI / count));

    const availableRadiusX = Math.max(
      260,
      Math.min(460, dimensions.width * 0.38),
    );

    const availableRadiusY = Math.max(
      220,
      Math.min(340, dimensions.height * 0.36),
    );

    const radiusX = Math.max(minRadiusX, availableRadiusX);
    const radiusY = Math.max(minRadiusY, availableRadiusY);

    others.forEach((node, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;

      result[node.id] = {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      };
    });

    return result;
  }, [nodes, selectedNodeId, dimensions]);

  // Sync positions state
  useEffect(() => {
    setNodePositions(defaultPositions);
  }, [defaultPositions]);

  const positions = useMemo(() => {
    const result = {};
    nodes.forEach((node) => {
      result[node.id] = nodePositions[node.id] ?? defaultPositions[node.id];
    });
    return result;
  }, [nodes, nodePositions, defaultPositions]);

  // Calculate connected nodes
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set();

    const connected = new Set([selectedNodeId]);
    relationships.forEach((relationship) => {
      if (relationship.source === selectedNodeId) {
        connected.add(relationship.target);
      }
      if (relationship.target === selectedNodeId) {
        connected.add(relationship.source);
      }
    });
    return connected;
  }, [relationships, selectedNodeId]);

  // Spring center on selected node
  useEffect(() => {
    if (selectedNodeId && positions[selectedNodeId]) {
      const nodePos = positions[selectedNodeId];
      const targetZoom = Math.max(0.85, Math.min(1.15, zoom));

      setZoom(targetZoom);
      setPan({
        x: dimensions.width / 2 - nodePos.x * targetZoom,
        y: dimensions.height / 2 - nodePos.y * targetZoom,
      });
    }
  }, [selectedNodeId, defaultPositions]);

  // Prevent browser page zoom on trackpad gesture
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventDefault = (e) => e.preventDefault();
    container.addEventListener("gesturestart", preventDefault, {
      passive: false,
    });
    container.addEventListener("gesturechange", preventDefault, {
      passive: false,
    });
    return () => {
      container.removeEventListener("gesturestart", preventDefault);
      container.removeEventListener("gesturechange", preventDefault);
    };
  }, []);

  // Pointer-relative mouse wheel zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = container.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      setZoom((currentZoom) => {
        const sensitivity = event.ctrlKey ? 0.012 : 0.0016;
        const factor = Math.exp(-event.deltaY * sensitivity);
        const nextZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, currentZoom * factor),
        );

        if (nextZoom === currentZoom) return currentZoom;

        const canvasX = (cursorX - pan.x) / currentZoom;
        const canvasY = (cursorY - pan.y) / currentZoom;

        setPan({
          x: cursorX - canvasX * nextZoom,
          y: cursorY - canvasY * nextZoom,
        });

        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [pan]);

  const handleCanvasPointerDown = (event) => {
    if (event.target.closest("[data-graph-node]")) return;

    pointersRef.current.set(event.pointerId, event);

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      setPinchDistance(getPointerDistance(first, second));
      setIsPanning(false);
      dragRef.current = null;
      return;
    }

    setIsPanning(true);
    dragRef.current = {
      type: "canvas",
      startX: event.clientX,
      startY: event.clientY,
      originalX: pan.x,
      originalY: pan.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleNodePointerDown = (event, node) => {
    if (event.target.closest("[data-node-focus]")) return;
    event.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    const canvasX = (cursorX - pan.x) / zoom;
    const canvasY = (cursorY - pan.y) / zoom;

    const currentPos = positions[node.id];

    dragRef.current = {
      type: "node",
      nodeId: node.id,
      offsetX: currentPos.x - canvasX,
      offsetY: currentPos.y - canvasY,
    };

    setDraggingNodeId(node.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    pointersRef.current.set(event.pointerId, event);

    // Multi-touch pinch zoom
    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const distance = getPointerDistance(first, second);
      const rect = containerRef.current.getBoundingClientRect();
      const center = getPointerCenter(first, second);
      const cursorX = center.x - rect.left;
      const cursorY = center.y - rect.top;

      if (pinchDistance && pinchDistance > 0) {
        const factor = distance / pinchDistance;
        setZoom((currentZoom) => {
          const nextZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, currentZoom * factor),
          );
          if (nextZoom === currentZoom) return currentZoom;

          const worldX = (cursorX - pan.x) / currentZoom;
          const worldY = (cursorY - pan.y) / currentZoom;

          setPan({
            x: cursorX - worldX * nextZoom,
            y: cursorY - worldY * nextZoom,
          });
          return nextZoom;
        });
      }
      setPinchDistance(distance);
      event.preventDefault();
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.type === "canvas") {
      setPan({
        x: drag.originalX + (event.clientX - drag.startX),
        y: drag.originalY + (event.clientY - drag.startY),
      });
      return;
    }

    if (drag.type === "node") {
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      const canvasX = (cursorX - pan.x) / zoom;
      const canvasY = (cursorY - pan.y) / zoom;

      setNodePositions((current) => ({
        ...current,
        [drag.nodeId]: {
          x: canvasX + drag.offsetX,
          y: canvasY + drag.offsetY,
        },
      }));
    }
  };

  const stopDragging = (event) => {
    if (event?.pointerId !== undefined) {
      pointersRef.current.delete(event.pointerId);
    }
    if (pointersRef.current.size < 2) {
      setPinchDistance(null);
    }
    dragRef.current = null;
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const resetView = () => {
    dragRef.current = null;
    pointersRef.current.clear();

    setDraggingNodeId(null);
    setIsPanning(false);
    setPinchDistance(null);

    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNodePositions(defaultPositions);
  };
  const isFocusMode = !!selectedNodeId;

  if (!nodes.length) {
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] transition-all duration-300">
        <div className="text-center p-6">
          <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Explore connections
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Select a developer from the sidebar to traverse the graph.
          </p>
        </div>
      </div>
    );
  }

  // Animation settings
  const canvasTransition =
    isPanning || draggingNodeId || prefersReducedMotion
      ? { type: "tween", duration: 0 }
      : { type: "spring", stiffness: 300, damping: 30, mass: 0.8 };

  return (
    <div
      ref={containerRef}
      className={[
        "relative h-[calc(100dvh-100px)] min-h-[480px] w-full overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--background)] select-none touch-none overscroll-none transition-colors duration-300",
        isPanning ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={(event) => {
        if (draggingNodeId || isPanning) return;
        pointersRef.current.delete(event.pointerId);
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {/* ambient backgrounds */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-[15%] top-[10%] h-[300px] w-[300px] rounded-full bg-blue-500/[0.04] dark:bg-blue-500/[0.03] blur-[120px] transition-all" />
        <div className="absolute right-[10%] top-[25%] h-[260px] w-[260px] rounded-full bg-purple-500/[0.03] dark:bg-purple-500/[0.02] blur-[110px] transition-all" />
        <div className="absolute bottom-[5%] left-[35%] h-[320px] w-[320px] rounded-full bg-teal-500/[0.03] dark:bg-teal-500/[0.02] blur-[130px] transition-all" />
      </div>

      {/* Grid patterns */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.8] transition-all"
        style={{
          backgroundImage: `radial-gradient(var(--graph-canvas-grid) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
        }}
        aria-hidden="true"
      />

      {/* Primary SVG Canvas */}
      <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none">
        <defs>
          <marker
            id="graph-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
          </marker>
        </defs>

        <motion.g
          animate={{
            x: pan.x,
            y: pan.y,
            scale: zoom,
          }}
          transition={canvasTransition}
        >
          {/* ==================================================
              RELATIONSHIPS (EDGES)
              ================================================== */}
          {relationships.map((relationship, index) => {
            const source = positions[relationship.source];
            const target = positions[relationship.target];

            if (!source || !target) return null;

            const sourceNode = nodes.find((n) => n.id === relationship.source);
            const targetNode = nodes.find((n) => n.id === relationship.target);

            if (!sourceNode || !targetNode) return null;

            const sourceSize = getNodeSize(sourceNode);
            const targetSize = getNodeSize(targetNode);

            // Active checks
            const isActive =
              !isFocusMode ||
              relationship.source === selectedNodeId ||
              relationship.target === selectedNodeId;

            const { path, midpoint } = getCurve(
              source,
              target,
              sourceSize,
              targetSize,
              index,
            );

            const label = String(relationship.type ?? "RELATES_TO");

            return (
              <g
                key={
                  relationship.id ??
                  `${relationship.source}-${relationship.target}-${index}`
                }
                className="transition-all duration-300"
                style={{
                  opacity: isActive ? 1 : 0.15,
                  filter: !isActive ? "blur(0.5px)" : "none",
                }}
              >
                {/* Underlay curve for selectability */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="12"
                  className="pointer-events-auto cursor-pointer"
                />

                {/* Base curve */}
                <path
                  d={path}
                  fill="none"
                  stroke={isActive ? "var(--accent)" : "var(--graph-line)"}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeLinecap="round"
                  opacity={isActive ? 0.75 : 0.5}
                />

                {/* Animated Directional Dashes */}
                {isActive && !prefersReducedMotion && (
                  <path
                    d={path}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 15"
                    markerEnd="url(#graph-arrow)"
                    opacity="0.9"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-38"
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </path>
                )}

                {/* Relationship label */}
                {isActive && (
                  <foreignObject
                    x={midpoint.x - 70}
                    y={midpoint.y - 12}
                    width={140}
                    height={24}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="flex items-center justify-center h-6 px-2.5 mx-auto w-fit rounded-full border border-[var(--border)] bg-[var(--surface)]/90 shadow-sm text-[8px] font-mono font-semibold tracking-wider text-[var(--text-secondary)] whitespace-nowrap">
                      {label}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* ==================================================
              NODES
              ================================================== */}
          {nodes.map((node) => {
            const position = positions[node.id];
            if (!position) return null;

            const { width, height } = getNodeSize(node);

            const isNodeSelected = node.id === selectedNodeId;
            const isNodeConnected = connectedNodeIds.has(node.id);
            const isNodeActive =
              !isFocusMode || isNodeSelected || isNodeConnected;
            const isNodeDragging = draggingNodeId === node.id;

            const category = String(node.label ?? "Node").toLowerCase();
            const categoryLabel = getNodeLabel(node.label);

            const nodeTransition =
              isNodeDragging || prefersReducedMotion
                ? { type: "tween", duration: 0 }
                : { type: "spring", stiffness: 300, damping: 30 };

            return (
              <motion.g
                key={node.id}
                data-graph-node
                animate={{
                  x: position.x - width / 2,
                  y: position.y - height / 2,
                }}
                transition={nodeTransition}
                className="pointer-events-auto"
                style={{
                  opacity: isNodeActive ? 1 : 0.2,
                  filter: !isNodeActive ? "blur(1.5px)" : "none",
                }}
                onPointerDown={(event) => handleNodePointerDown(event, node)}
              >
                <foreignObject
                  width={width}
                  height={height}
                  className="overflow-visible"
                >
                  <motion.div
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            y: [0, 1.8, -1.8, 0],
                            x: [0, -1.2, 1.2, 0],
                          }
                    }
                    transition={
                      prefersReducedMotion
                        ? {}
                        : {
                            duration: 7 + (node.id.charCodeAt(0) % 5),
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                    }
                    className={[
                      "w-full h-full rounded-2xl border p-3.5 flex flex-col justify-between select-none shadow-md transition-all duration-300",
                      isNodeSelected
                        ? "border-[var(--accent)] bg-[var(--surface)] ring-1.5 ring-[var(--accent)]/30 shadow-[0_0_12px_rgba(10,132,255,0.12)]"
                        : "border-[var(--border)] bg-[var(--surface)]/95 hover:border-[var(--text-secondary)]/50",
                    ].join(" ")}
                  >
                    {/* Level 1: Category Tag */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className={[
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold tracking-wider w-fit",
                          `bg-[var(--node-${category}-bg)] border-[var(--node-${category}-border)] text-[var(--node-${category}-accent)]`,
                        ].join(" ")}
                      >
                        {/* <span
                          className={`h-1.5 w-1.5 rounded-full bg-[var(--node-${category}-accent)]`}
                        /> */}
                        {categoryLabel}
                      </div>
                    </div>

                    {/* Level 2: Title */}
                    <h4 className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)] truncate mt-1.5 px-0.5">
                      {node.name}
                    </h4>

                    {/* Level 3: Focus Button */}
                    <button
                      data-node-focus
                      onClick={(e) => {
                        e.stopPropagation();
                        onNodeSelect?.(node);
                      }}
                      className="w-full flex items-center justify-center gap-1 h-7 mt-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--background)] text-[9px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition focus:outline-none focus:ring-1.5 focus:ring-[var(--accent)] cursor-pointer"
                    >
                      Focus
                      <ArrowUpRight
                        size={10}
                        className="text-[var(--text-secondary)]"
                      />
                    </button>
                  </motion.div>
                </foreignObject>
              </motion.g>
            );
          })}
        </motion.g>
      </svg>

      {/* Title Header overlay */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 select-none">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Cognodb Network
        </p>
        <h2 className="mt-1 max-w-[360px] text-base font-semibold tracking-tight text-[var(--text-primary)]">
          Interactive Relationship Traversal
        </h2>
      </div>

      {/* Top right zoom indicator */}
      <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1 font-mono text-[9px] text-[var(--text-secondary)] backdrop-blur-xl">
        {Math.round(zoom * 100)}%
      </div>

      {/* Help controls indicator overlay */}
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-2 text-[9px] font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-xl">
        Drag nodes · Drag canvas · Scroll or pinch to zoom
      </div>

      {/* Reset view control button */}
      <button
        type="button"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          resetView();
        }}
        className="absolute bottom-5 right-5 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-2 text-[9px] font-semibold text-[var(--text-primary)] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[var(--surface)] focus:outline-none focus-visible:ring-1.5 focus-visible:ring-[var(--accent)] cursor-pointer"
      >
        Reset view
      </button>
    </div>
  );
}

export default GraphCanvas;
