import { useEffect, useMemo, useRef, useState } from "react";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 3.2;

const NODE_STYLES = {
  Developer: {
    dark: {
      background: "rgba(37, 99, 235, 0.18)",
      border: "rgba(96, 165, 250, 0.42)",
      accent: "#60a5fa",
      glow: "rgba(59, 130, 246, 0.24)",
    },
    light: {
      background: "rgba(59, 130, 246, 0.10)",
      border: "rgba(37, 99, 235, 0.28)",
      accent: "#2563eb",
      glow: "rgba(37, 99, 235, 0.16)",
    },
  },

  Project: {
    dark: {
      background: "rgba(139, 92, 246, 0.16)",
      border: "rgba(167, 139, 250, 0.38)",
      accent: "#a78bfa",
      glow: "rgba(139, 92, 246, 0.20)",
    },
    light: {
      background: "rgba(124, 58, 237, 0.08)",
      border: "rgba(124, 58, 237, 0.24)",
      accent: "#7c3aed",
      glow: "rgba(124, 58, 237, 0.12)",
    },
  },

  Technology: {
    dark: {
      background: "rgba(20, 184, 166, 0.14)",
      border: "rgba(45, 212, 191, 0.34)",
      accent: "#2dd4bf",
      glow: "rgba(20, 184, 166, 0.18)",
    },
    light: {
      background: "rgba(13, 148, 136, 0.08)",
      border: "rgba(13, 148, 136, 0.22)",
      accent: "#0f766e",
      glow: "rgba(13, 148, 136, 0.10)",
    },
  },
};

function getNodeSize(node) {
  const name = String(node?.name ?? "Node");
  const category = String(node?.label ?? "Node");

  // Width is driven by the longest piece of content.
  const categoryWidth = category.length * 6.5 + 42;
  const titleWidth = name.length * 9 + 40;

  const width = Math.min(
    380,
    Math.max(190, categoryWidth, titleWidth),
  );

  return {
    width,
    height: 122,
  };
}

function getNodeLabel(label) {
  return String(label ?? "Node").toUpperCase();
}

function getEdgePoint(from, to, width, height) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === 0) {
    return {
      x: from.x,
      y: from.y,
    };
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
  const start = getEdgePoint(
    source,
    target,
    sourceSize.width,
    sourceSize.height,
  );

  const end = getEdgePoint(target, source, targetSize.width, targetSize.height);

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

  const normalX = -dy / distance;
  const normalY = dx / distance;

  const curveAmount = Math.min(170, Math.max(45, distance * 0.13));

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
    path: `
      M ${start.x} ${start.y}
      Q ${control.x} ${control.y}
      ${end.x} ${end.y}
    `,

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

  const [zoom, setZoom] = useState(1);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const [nodePositions, setNodePositions] = useState({});

  const [draggingNodeId, setDraggingNodeId] = useState(null);

  const [isPanning, setIsPanning] = useState(false);

  const [pinchDistance, setPinchDistance] = useState(null);

  const nodes = data?.nodes ?? [];
  const relationships = data?.relationships ?? [];

  /*
   * ============================================================
   * DEFAULT NODE POSITIONS
   * ============================================================
   */

  const defaultPositions = useMemo(() => {
    const result = {};

    if (!nodes.length) {
      return result;
    }

    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;

    const selected = selectedNodeId
      ? nodes.find((node) => node.id === selectedNodeId)
      : null;

    const others = nodes.filter((node) => node.id !== selectedNodeId);

    if (selected) {
      result[selected.id] = {
        x: centerX,
        y: centerY,
      };
    }

    const radiusX = selected ? 430 : 500;
    const radiusY = selected ? 260 : 310;

    others.forEach((node, index) => {
      const angle =
        (index / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;

      result[node.id] = {
        x: centerX + Math.cos(angle) * radiusX,

        y: centerY + Math.sin(angle) * radiusY,
      };
    });

    return result;
  }, [nodes, selectedNodeId]);

  /*
   * ============================================================
   * PRESERVE MANUAL POSITIONS
   * ============================================================
   */

  useEffect(() => {
    setNodePositions((current) => {
      const next = {};

      nodes.forEach((node) => {
        next[node.id] = current[node.id] ?? defaultPositions[node.id];
      });

      return next;
    });
  }, [nodes, defaultPositions]);

  const positions = useMemo(() => {
    const result = {};

    nodes.forEach((node) => {
      result[node.id] = nodePositions[node.id] ?? defaultPositions[node.id];
    });

    return result;
  }, [nodes, nodePositions, defaultPositions]);

  /*
   * ============================================================
   * CONNECTED NODES
   * ============================================================
   */

  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) {
      return new Set(nodes.map((node) => node.id));
    }

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
  }, [nodes, relationships, selectedNodeId]);

  /*
   * ============================================================
   * CANVAS ZOOM
   *
   * Desktop:
   *   mouse wheel
   *
   * Trackpad:
   *   pinch generates wheel events with ctrlKey
   *
   * The event is captured directly by the canvas,
   * preventing browser/page zoom.
   * ============================================================
   */

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = container.getBoundingClientRect();

      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      const svgX = (cursorX / rect.width) * WORLD_WIDTH;

      const svgY = (cursorY / rect.height) * WORLD_HEIGHT;

      setZoom((currentZoom) => {
        const sensitivity = event.ctrlKey ? 0.018 : 0.0024;

        const factor = Math.exp(-event.deltaY * sensitivity);

        const nextZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, currentZoom * factor),
        );

        if (nextZoom === currentZoom) {
          return currentZoom;
        }

        // IMPORTANT:
        // Calculate the world point using the CURRENT zoom.
        const worldX = (svgX - pan.x) / currentZoom;

        const worldY = (svgY - pan.y) / currentZoom;

        // Keep that exact world point under
        // the cursor after zooming.
        setPan({
          x: svgX - worldX * nextZoom,
          y: svgY - worldY * nextZoom,
        });

        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [pan]);

  /*
   * ============================================================
   * SCREEN -> WORLD
   * ============================================================
   */

  const getWorldPoint = (event) => {
    const container = containerRef.current;

    if (!container) {
      return { x: 0, y: 0 };
    }

    const rect = container.getBoundingClientRect();

    const svgX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;

    const svgY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;

    return {
      x: (svgX - pan.x) / zoom,
      y: (svgY - pan.y) / zoom,
    };
  };

  /*
   * ============================================================
   * CANVAS PAN
   * ============================================================
   */

  const handleCanvasPointerDown = (event) => {
    if (event.target.closest("[data-graph-node]")) {
      return;
    }

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

  /*
   * ============================================================
   * NODE DRAG
   * ============================================================
   */

  const handleNodePointerDown = (event, node) => {
    if (event.target.closest("[data-node-focus]")) {
      return;
    }

    event.stopPropagation();

    const point = getWorldPoint(event);

    const current = positions[node.id];

    dragRef.current = {
      type: "node",

      nodeId: node.id,

      offsetX: current.x - (point.x - pan.x) / zoom,

      offsetY: current.y - (point.y - pan.y) / zoom,
    };

    setDraggingNodeId(node.id);

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  /*
   * ============================================================
   * POINTER MOVE
   * ============================================================
   */

  const handlePointerMove = (event) => {
    pointersRef.current.set(event.pointerId, event);

    /*
     * Native two-finger pinch.
     */
    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());

      const distance = getPointerDistance(first, second);

      const rect = containerRef.current.getBoundingClientRect();

      const center = getPointerCenter(first, second);

      const cursorX = center.x - rect.left;

      const cursorY = center.y - rect.top;

      const svgX = (cursorX / rect.width) * WORLD_WIDTH;

      const svgY = (cursorY / rect.height) * WORLD_HEIGHT;

      if (pinchDistance && pinchDistance > 0) {
        const factor = distance / pinchDistance;

        setZoom((currentZoom) => {
          const nextZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, currentZoom * factor),
          );

          if (nextZoom === currentZoom) {
            return currentZoom;
          }

          const worldX = (svgX - pan.x) / currentZoom;

          const worldY = (svgY - pan.y) / currentZoom;

          setPan({
            x: svgX - worldX * nextZoom,

            y: svgY - worldY * nextZoom,
          });

          return nextZoom;
        });
      }

      setPinchDistance(distance);

      event.preventDefault();

      return;
    }

    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    /*
     * Canvas pan.
     */
    if (drag.type === "canvas") {
      const container = containerRef.current;

      const rect = container.getBoundingClientRect();

      const scaleX = WORLD_WIDTH / rect.width;

      const scaleY = WORLD_HEIGHT / rect.height;

      setPan({
        x: drag.originalX + (event.clientX - drag.startX) * scaleX,

        y: drag.originalY + (event.clientY - drag.startY) * scaleY,
      });

      return;
    }

    /*
     * Node drag.
     */
    const point = getWorldPoint(event);

    const nextPosition = {
      x: (point.x - pan.x) / zoom + drag.offsetX,

      y: (point.y - pan.y) / zoom + drag.offsetY,
    };

    setNodePositions((current) => ({
      ...current,

      [drag.nodeId]: nextPosition,
    }));
  };

  /*
   * ============================================================
   * STOP DRAG
   * ============================================================
   */

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

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  const resetView = () => {
    setZoom(1);

    setPan({
      x: 0,
      y: 0,
    });

    setNodePositions(defaultPositions);
  };

  /*
   * ============================================================
   * EMPTY STATE
   * ============================================================
   */

  if (!nodes.length) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--background)]">
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Explore your data
            <br />
            as it actually connects.
          </p>

          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Select a developer from the schema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative",
        "h-[calc(100dvh-120px)]",
        "min-h-[480px]",
        "w-full",
        "overflow-hidden",
        "rounded-[24px]",
        "border",
        "border-[var(--border)]",
        "bg-[var(--background)]",
        "select-none",
        "touch-none",
        "overscroll-none",
        isPanning ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={(event) => {
        if (draggingNodeId || isPanning) {
          return;
        }

        pointersRef.current.delete(event.pointerId);
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {/* ========================================================
          AMBIENT BACKGROUND
          ======================================================== */}

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="
            absolute
            left-[18%]
            top-[12%]
            h-[260px]
            w-[260px]
            rounded-full
            bg-blue-500/[0.07]
            blur-[100px]
          "
        />

        <div
          className="
            absolute
            right-[14%]
            top-[28%]
            h-[220px]
            w-[220px]
            rounded-full
            bg-indigo-500/[0.06]
            blur-[90px]
          "
        />

        <div
          className="
            absolute
            bottom-[8%]
            left-[42%]
            h-[280px]
            w-[280px]
            rounded-full
            bg-sky-400/[0.045]
            blur-[110px]
          "
        />

        <div
          className="
            absolute
            right-[-80px]
            bottom-[-90px]
            h-[260px]
            w-[260px]
            rounded-full
            bg-blue-500/[0.05]
            blur-[100px]
          "
        />
      </div>

      {/* ========================================================
          DOT GRID
          ======================================================== */}

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.7]"
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="cognodb-dot-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="var(--graph-canvas-grid)" />
          </pattern>
        </defs>

        <rect
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          fill="url(#cognodb-dot-grid)"
        />
      </svg>

      {/* ========================================================
          GRAPH
          ======================================================== */}

      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Arrow */}
          <marker
            id="graph-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
          </marker>

          {/* Soft node shadow */}
          <filter id="node-shadow" x="-40%" y="-40%" width="180%" height="200%">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="14"
              floodOpacity="0.10"
            />
          </filter>

          {/* Selected node glow */}
          <filter
            id="selected-node-glow"
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="16"
              floodColor="var(--accent)"
              floodOpacity="0.32"
            />
          </filter>
        </defs>

        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {/* ==================================================
              RELATIONSHIPS
              ================================================== */}

          {relationships.map((relationship, index) => {
            const source = positions[relationship.source];

            const target = positions[relationship.target];

            if (!source || !target) {
              return null;
            }

            const sourceNode = nodes.find(
              (node) => node.id === relationship.source,
            );

            const targetNode = nodes.find(
              (node) => node.id === relationship.target,
            );

            if (!sourceNode || !targetNode) {
              return null;
            }

            const sourceSize = getNodeSize(sourceNode);

            const targetSize = getNodeSize(targetNode);

            const active =
              !selectedNodeId ||
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

            const labelWidth = Math.max(82, label.length * 7 + 28);

            const labelHeight = 24;

            return (
              <g
                key={
                  relationship.id ??
                  `${relationship.source}-${relationship.target}-${index}`
                }
                className="transition-opacity duration-300"
                opacity={active ? 1 : 0.08}
              >
                {/* Base curve */}
                <path
                  d={path}
                  fill="none"
                  stroke="var(--graph-line)"
                  strokeWidth={active ? 1.6 : 1}
                  strokeLinecap="round"
                />

                {/* Animated directional curve */}
                {active && (
                  <path
                    d={path}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="3 12"
                    markerEnd="url(#graph-arrow)"
                    opacity="0.65"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-30"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </path>
                )}

                {/* Relationship label */}
                {active && (
                  <g
                    transform={`
                        translate(
                          ${midpoint.x - labelWidth / 2}
                          ${midpoint.y - labelHeight / 2}
                        )
                      `}
                  >
                    <rect
                      width={labelWidth}
                      height={labelHeight}
                      rx="12"
                      fill="var(--surface)"
                      fillOpacity="0.92"
                      stroke="var(--border)"
                      strokeWidth="1"
                    />

                    <text
                      x={labelWidth / 2}
                      y="15.5"
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      className="font-mono text-[8px] font-medium tracking-[0.08em]"
                    >
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ==================================================
              NODES
              ================================================== */}

{nodes.map((node) => {
  const position = positions[node.id];

  if (!position) {
    return null;
  }

  const { width, height } = getNodeSize(node);

  const selected = node.id === selectedNodeId;
  const visible = connectedNodeIds.has(node.id);
  const dragging = draggingNodeId === node.id;

  /*
   * Remove unrelated nodes during focus mode.
   */
  if (selectedNodeId && !visible) {
    return null;
  }

  const category = String(node.label ?? "Node").toLowerCase();

  const categoryLabel = getNodeLabel(node.label);

  const categoryWidth = Math.min(
    150,
    categoryLabel.length * 6.5 + 42,
  );

  return (
    <g
      key={node.id}
      data-graph-node
      transform={`
        translate(
          ${position.x - width / 2}
          ${position.y - height / 2}
        )
      `}
      className={dragging ? "cursor-grabbing" : "cursor-grab"}
      onPointerDown={(event) =>
        handleNodePointerDown(event, node)
      }
    >
      {/* ==================================================
          SELECTED NODE OUTLINE
          ================================================== */}

      {selected && (
        <rect
          x="-7"
          y="-7"
          width={width + 14}
          height={height + 14}
          rx="22"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          opacity="0.65"
          filter="url(#selected-node-glow)"
        />
      )}

      {/* ==================================================
          NODE SHADOW
          ================================================== */}

      <rect
        x="0"
        y="5"
        width={width}
        height={height}
        rx="20"
        fill="black"
        opacity="0.14"
        filter="url(#node-shadow)"
      />

      {/* ==================================================
          MAIN NODE
          ================================================== */}

      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="20"
        fill="var(--surface)"
        fillOpacity="0.96"
        stroke={
          selected
            ? "var(--accent)"
            : "var(--border)"
        }
        strokeWidth={selected ? 1.5 : 1}
      />

      {/* Subtle inner border */}

      <rect
        x="1"
        y="1"
        width={width - 2}
        height={height - 2}
        rx="19"
        fill="none"
        stroke="white"
        strokeOpacity={selected ? 0.10 : 0.04}
        strokeWidth="1"
      />

      {/* ==================================================
          LEVEL 1 — CATEGORY TAG
          ================================================== */}

      <g transform="translate(15 13)">
        <rect
          width={categoryWidth}
          height="23"
          rx="11.5"
          fill={`var(--node-${category}-bg)`}
          stroke={`var(--node-${category}-border)`}
          strokeWidth="1"
        />

        <circle
          cx="10"
          cy="11.5"
          r="3"
          fill={`var(--node-${category}-accent)`}
        />

        <text
          x="18"
          y="15"
          fill="var(--text-secondary)"
          className="
            font-mono
            text-[8px]
            font-semibold
            tracking-[0.1em]
          "
        >
          {categoryLabel}
        </text>
      </g>

      {/* ==================================================
          LEVEL 2 — TITLE
          ================================================== */}

      <text
        x="15"
        y="67"
        fill="var(--text-primary)"
        className="
          text-[17px]
          font-semibold
          tracking-[-0.025em]
        "
      >
        {node.name}
      </text>

      {/* ==================================================
          LEVEL 3 — FULL WIDTH FOCUS BUTTON
          ================================================== */}

      <g
        data-node-focus
        transform={`translate(15 ${height - 39})`}
        role="button"
        tabIndex="0"
        aria-label={`Focus ${node.name}`}
        className="cursor-pointer"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();

          onNodeSelect?.(node);
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            onNodeSelect?.(node);
          }
        }}
      >
        <rect
          width={width - 30}
          height="25"
          rx="12.5"
          fill="var(--surface)"
          fillOpacity="0.72"
          stroke="var(--border)"
          strokeWidth="1"
        />

        <circle
          cx="12"
          cy="12.5"
          r="3"
          fill="var(--accent)"
          opacity="0.9"
        />

        <text
          x="22"
          y="16"
          fill="var(--text-secondary)"
          className="
            text-[9px]
            font-medium
          "
        >
          Focus
        </text>
      </g>
    </g>
  );
})}
        </g>
      </svg>

      {/* ========================================================
          GRAPH HEADER
          ======================================================== */}

      <div className="pointer-events-none absolute left-6 top-6 z-10">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Graph Explorer
        </p>

        <h2 className="mt-1.5 max-w-[360px] text-lg font-semibold tracking-[-0.035em] text-[var(--text-primary)]">
          Explore your data as it actually connects.
        </h2>
      </div>

      {/* ========================================================
          CANVAS HELP
          ======================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          left-5
          z-10
          rounded-full
          border
          border-[var(--border)]
          bg-[var(--surface)]/80
          px-4
          py-2
          text-[10px]
          font-medium
          text-[var(--text-secondary)]
          shadow-sm
          backdrop-blur-xl
        "
      >
        Drag nodes · Drag canvas · Scroll or pinch to zoom
      </div>

      {/* ========================================================
          RESET
          ======================================================== */}

      <button
        type="button"
        onClick={resetView}
        className="
          absolute
          bottom-5
          right-5
          z-10
          rounded-full
          border
          border-[var(--border)]
          bg-[var(--surface)]/80
          px-4
          py-2
          text-[10px]
          font-medium
          text-[var(--text-primary)]
          shadow-sm
          backdrop-blur-xl
          transition
          duration-200
          hover:-translate-y-0.5
          hover:bg-[var(--surface)]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--accent)]
        "
      >
        Reset view
      </button>

      {/* ========================================================
          ZOOM INDICATOR
          ======================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-5
          top-5
          z-10
          rounded-full
          border
          border-[var(--border)]
          bg-[var(--surface)]/70
          px-3
          py-1.5
          font-mono
          text-[9px]
          text-[var(--text-secondary)]
          backdrop-blur-xl
        "
      >
        {Math.round(zoom * 100)}%
      </div>

      {/* ========================================================
          THEME-AWARE NODE CSS VARIABLES
          ======================================================== */}

      <style>
        {`
          .group {
            isolation: isolate;
          }

          :global(:root) {
            --node-developer-bg: rgba(37, 99, 235, 0.10);
            --node-developer-border: rgba(37, 99, 235, 0.22);
            --node-developer-accent: #2563eb;

            --node-project-bg: rgba(124, 58, 237, 0.08);
            --node-project-border: rgba(124, 58, 237, 0.20);
            --node-project-accent: #7c3aed;

            --node-technology-bg: rgba(13, 148, 136, 0.08);
            --node-technology-border: rgba(13, 148, 136, 0.20);
            --node-technology-accent: #0f766e;
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.001ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.001ms !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default GraphCanvas;
