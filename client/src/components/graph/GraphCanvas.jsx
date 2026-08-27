import { useEffect, useMemo, useRef, useState } from "react";

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 820;

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 2.5;

const NODE_STYLES = {
  Developer: {
    fill: "#0A84FF",
  },

  Project: {
    fill: "#8B5CF6",
  },

  Technology: {
    fill: "#10B981",
  },
};

function getNodeSize(node) {
  const name = String(node?.name ?? "");

  /*
   * Dynamic width based on actual content.
   */
  const calculatedWidth =
    150 + name.length * 8;

  return {
    width: Math.min(
      320,
      Math.max(190, calculatedWidth),
    ),

    height: 94,
  };
}

function GraphCanvas({
  data,
  selectedNodeId,
  onNodeSelect,
}) {
  const containerRef = useRef(null);

  const dragRef = useRef(null);

  const [zoom, setZoom] = useState(1);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const [nodePositions, setNodePositions] =
    useState({});

  const [draggingNodeId, setDraggingNodeId] =
    useState(null);

  const [isPanning, setIsPanning] =
    useState(false);

  const nodes = data?.nodes ?? [];

  const relationships =
    data?.relationships ?? [];

  /*
   * --------------------------------------------------
   * DEFAULT GRAPH POSITIONS
   * --------------------------------------------------
   */

  const defaultPositions = useMemo(() => {
    const result = {};

    if (!nodes.length) {
      return result;
    }

    const centerX =
      CANVAS_WIDTH / 2;

    const centerY =
      CANVAS_HEIGHT / 2;

    const selected = selectedNodeId
      ? nodes.find(
          (node) =>
            node.id === selectedNodeId,
        )
      : null;

    const others = nodes.filter(
      (node) =>
        node.id !== selectedNodeId,
    );

    /*
     * Give the graph more breathing room.
     */

    const radiusX = selected
      ? 390
      : 470;

    const radiusY = selected
      ? 250
      : 300;

    if (selected) {
      result[selected.id] = {
        x: centerX,
        y: centerY,
      };
    }

    others.forEach(
      (node, index) => {
        const angle =
          (index /
            Math.max(
              others.length,
              1,
            )) *
            Math.PI *
            2 -
          Math.PI / 2;

        result[node.id] = {
          x:
            centerX +
            Math.cos(angle) *
              radiusX,

          y:
            centerY +
            Math.sin(angle) *
              radiusY,
        };
      },
    );

    return result;
  }, [
    nodes,
    selectedNodeId,
  ]);

  /*
   * --------------------------------------------------
   * KEEP USER-MOVED NODE POSITIONS
   * --------------------------------------------------
   */

  useEffect(() => {
    setNodePositions(
      (current) => {
        const next = {};

        nodes.forEach(
          (node) => {
            next[node.id] =
              current[node.id] ??
              defaultPositions[
                node.id
              ];
          },
        );

        return next;
      },
    );
  }, [
    nodes,
    defaultPositions,
  ]);

  const positions = useMemo(() => {
    const result = {};

    nodes.forEach(
      (node) => {
        result[node.id] =
          nodePositions[node.id] ??
          defaultPositions[node.id];
      },
    );

    return result;
  }, [
    nodes,
    nodePositions,
    defaultPositions,
  ]);

  /*
   * --------------------------------------------------
   * CONNECTED NODES
   * --------------------------------------------------
   */

  const connectedNodeIds =
    useMemo(() => {
      if (!selectedNodeId) {
        return new Set(
          nodes.map(
            (node) => node.id,
          ),
        );
      }

      const connected =
        new Set([
          selectedNodeId,
        ]);

      relationships.forEach(
        (relationship) => {
          if (
            relationship.source ===
            selectedNodeId
          ) {
            connected.add(
              relationship.target,
            );
          }

          if (
            relationship.target ===
            selectedNodeId
          ) {
            connected.add(
              relationship.source,
            );
          }
        },
      );

      return connected;
    }, [
      nodes,
      relationships,
      selectedNodeId,
    ]);

  /*
   * --------------------------------------------------
   * CANVAS-ONLY ZOOM
   * --------------------------------------------------
   */

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return undefined;
    }

    const handleWheel = (event) => {
      /*
       * IMPORTANT:
       * Prevent browser/page zoom and scrolling.
       */

      event.preventDefault();
      event.stopPropagation();

      setZoom(
        (current) => {
          const factor =
            Math.exp(
              -event.deltaY *
                0.0015,
            );

          const next =
            current * factor;

          return Math.min(
            MAX_ZOOM,
            Math.max(
              MIN_ZOOM,
              next,
            ),
          );
        },
      );
    };

    container.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      },
    );

    return () => {
      container.removeEventListener(
        "wheel",
        handleWheel,
      );
    };
  }, []);

  /*
   * --------------------------------------------------
   * SCREEN -> GRAPH COORDINATES
   * --------------------------------------------------
   */

  const getCanvasPoint = (
    event,
  ) => {
    const rect =
      containerRef.current.getBoundingClientRect();

    return {
      x:
        ((event.clientX -
          rect.left) /
          rect.width) *
        CANVAS_WIDTH,

      y:
        ((event.clientY -
          rect.top) /
          rect.height) *
        CANVAS_HEIGHT,
    };
  };

  /*
   * --------------------------------------------------
   * CANVAS PANNING
   * --------------------------------------------------
   */

  const handleCanvasPointerDown = (
    event,
  ) => {
    if (
      event.target.closest(
        "[data-graph-node]",
      )
    ) {
      return;
    }

    setIsPanning(true);

    dragRef.current = {
      type: "canvas",

      startX:
        event.clientX,

      startY:
        event.clientY,

      originalX:
        pan.x,

      originalY:
        pan.y,
    };

    event.currentTarget.setPointerCapture?.(
      event.pointerId,
    );
  };

  /*
   * --------------------------------------------------
   * NODE DRAGGING
   * --------------------------------------------------
   */

  const handleNodePointerDown = (
    event,
    node,
  ) => {
    /*
     * Clicking Focus should NOT drag.
     */

    if (
      event.target.closest(
        "[data-node-focus]",
      )
    ) {
      return;
    }

    event.stopPropagation();

    const point =
      getCanvasPoint(event);

    const current =
      positions[node.id];

    dragRef.current = {
      type: "node",

      nodeId: node.id,

      offsetX:
        current.x -
        (point.x - pan.x) /
          zoom,

      offsetY:
        current.y -
        (point.y - pan.y) /
          zoom,
    };

    setDraggingNodeId(
      node.id,
    );

    event.currentTarget.setPointerCapture?.(
      event.pointerId,
    );
  };

  /*
   * --------------------------------------------------
   * POINTER MOVEMENT
   * --------------------------------------------------
   */

  const handlePointerMove = (
    event,
  ) => {
    const drag =
      dragRef.current;

    if (!drag) {
      return;
    }

    /*
     * Canvas movement
     */

    if (
      drag.type ===
      "canvas"
    ) {
      const rect =
        containerRef.current.getBoundingClientRect();

      const scaleX =
        CANVAS_WIDTH /
        rect.width;

      const scaleY =
        CANVAS_HEIGHT /
        rect.height;

      setPan({
        x:
          drag.originalX +
          (event.clientX -
            drag.startX) *
            scaleX,

        y:
          drag.originalY +
          (event.clientY -
            drag.startY) *
            scaleY,
      });

      return;
    }

    /*
     * Node movement
     */

    const point =
      getCanvasPoint(event);

    const nextPosition = {
      x:
        (point.x -
          pan.x) /
          zoom +
        drag.offsetX,

      y:
        (point.y -
          pan.y) /
          zoom +
        drag.offsetY,
    };

    setNodePositions(
      (current) => ({
        ...current,

        [drag.nodeId]:
          nextPosition,
      }),
    );
  };

  const stopDragging = () => {
    dragRef.current =
      null;

    setDraggingNodeId(
      null,
    );

    setIsPanning(false);
  };

  /*
   * --------------------------------------------------
   * RESET
   * --------------------------------------------------
   */

  const resetView = () => {
    setZoom(1);

    setPan({
      x: 0,
      y: 0,
    });

    setNodePositions(
      defaultPositions,
    );
  };

  /*
   * --------------------------------------------------
   * PREMIUM CURVED EDGE
   * --------------------------------------------------
   */

  const getCurve = (
    source,
    target,
    index,
  ) => {
    const dx =
      target.x -
      source.x;

    const dy =
      target.y -
      source.y;

    const distance =
      Math.max(
        Math.sqrt(
          dx * dx +
            dy * dy,
        ),
        1,
      );

    const normalX =
      -dy / distance;

    const normalY =
      dx / distance;

    /*
     * Different curves prevent
     * edges from stacking directly
     * on top of each other.
     */

    const curve =
      45 +
      (index % 4) * 22;

    const controlX =
      (source.x +
        target.x) /
        2 +
      normalX * curve;

    const controlY =
      (source.y +
        target.y) /
        2 +
      normalY * curve;

    return `
      M ${source.x} ${source.y}
      Q ${controlX} ${controlY}
        ${target.x} ${target.y}
    `;
  };

  /*
   * --------------------------------------------------
   * EMPTY STATE
   * --------------------------------------------------
   */

  if (!nodes.length) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-[28px] bg-[var(--background)]">
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-[-0.03em]">
            Explore your data
            <br />
            as it actually
            connects.
          </p>

          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Select a developer
            from the schema.
          </p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * GRAPH
   * --------------------------------------------------
   */

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-0 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--background)] select-none touch-none overscroll-contain ${
        isPanning
          ? "cursor-grabbing"
          : "cursor-grab"
      }`}
      onPointerDown={
        handleCanvasPointerDown
      }
      onPointerMove={
        handlePointerMove
      }
      onPointerUp={
        stopDragging
      }
      onPointerCancel={
        stopDragging
      }
    >
      {/* =====================================================
          DOT BACKGROUND
      ====================================================== */}

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="graph-dots"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="2"
              cy="2"
              r="1.35"
              fill="var(--graph-dot)"
            />
          </pattern>
        </defs>

        <rect
          width={
            CANVAS_WIDTH
          }
          height={
            CANVAS_HEIGHT
          }
          fill="url(#graph-dots)"
        />
      </svg>

      {/* =====================================================
          GRAPH SVG
      ====================================================== */}

      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <g
          transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
        >
          {/* =================================================
              RELATIONSHIPS
          ================================================== */}

          {relationships.map(
            (
              relationship,
              index,
            ) => {
              const source =
                positions[
                  relationship
                    .source
                ];

              const target =
                positions[
                  relationship
                    .target
                ];

              if (
                !source ||
                !target
              ) {
                return null;
              }

              const active =
                !selectedNodeId ||
                relationship.source ===
                  selectedNodeId ||
                relationship.target ===
                  selectedNodeId;

              return (
                <g
                  key={
                    relationship.id
                  }
                  style={{
                    opacity:
                      active
                        ? 1
                        : 0.15,
                  }}
                  className="transition-opacity duration-300"
                >
                  {/* Main curve */}

                  <path
                    d={getCurve(
                      source,
                      target,
                      index,
                    )}
                    fill="none"
                    stroke={
                      active
                        ? "var(--graph-line)"
                        : "var(--graph-line-muted)"
                    }
                    strokeWidth={
                      active
                        ? 2
                        : 1.2
                    }
                    strokeLinecap="round"
                  />

                  {/* Relationship label */}

                  {active && (
                    <text
                      x={
                        (source.x +
                          target.x) /
                        2
                      }
                      y={
                        (source.y +
                          target.y) /
                          2 -
                        14
                      }
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      className="font-mono text-[9px] tracking-[0.06em]"
                    >
                      {
                        relationship.type
                      }
                    </text>
                  )}
                </g>
              );
            },
          )}

          {/* =================================================
              NODES
          ================================================== */}

          {nodes.map(
            (
              node,
              index,
            ) => {
              const position =
                positions[
                  node.id
                ];

              if (!position) {
                return null;
              }

              const {
                width,
                height,
              } =
                getNodeSize(
                  node,
                );

              const style =
                NODE_STYLES[
                  node.label
                ] ?? {
                  fill:
                    "#6B7280",
                };

              const selected =
                node.id ===
                selectedNodeId;

              const visible =
                connectedNodeIds.has(
                  node.id,
                );

              const dragging =
                draggingNodeId ===
                node.id;

              return (
                <g
                  key={node.id}
                  data-graph-node
                  transform={`translate(${position.x - width / 2} ${position.y - height / 2})`}
                  className={
                    dragging
                      ? "cursor-grabbing"
                      : "cursor-grab"
                  }
                  style={{
                    opacity:
                      visible
                        ? 1
                        : 0.2,

                    transition:
                      dragging
                        ? "none"
                        : "opacity 300ms ease",
                  }}
                  onPointerDown={(
                    event,
                  ) =>
                    handleNodePointerDown(
                      event,
                      node,
                    )
                  }
                >
                  {/* =================================================
                      SELECTION RING
                  ================================================== */}

                  {selected && (
                    <rect
                      x="-8"
                      y="-8"
                      width={
                        width +
                        16
                      }
                      height={
                        height +
                        16
                      }
                      rx="24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  )}

                  {/* =================================================
                      NODE SHADOW
                  ================================================== */}

                  <rect
                    x="0"
                    y="4"
                    width={
                      width
                    }
                    height={
                      height
                    }
                    rx="20"
                    fill="black"
                    opacity={
                      selected
                        ? 0.18
                        : 0.12
                    }
                  />

                  {/* =================================================
                      MAIN NODE
                  ================================================== */}

                  <rect
                    width={
                      width
                    }
                    height={
                      height
                    }
                    rx="20"
                    fill={
                      style.fill
                    }
                  />

                  {/* =================================================
                      INNER BORDER
                  ================================================== */}

                  <rect
                    x="1"
                    y="1"
                    width={
                      width -
                      2
                    }
                    height={
                      height -
                      2
                    }
                    rx="19"
                    fill="none"
                    stroke="white"
                    strokeOpacity="0.2"
                  />

                  {/* =================================================
                      TYPE INDICATOR
                  ================================================== */}

                  <circle
                    cx="18"
                    cy="20"
                    r="4"
                    fill="white"
                    opacity="0.85"
                  />

                  <text
                    x="30"
                    y="24"
                    fill="white"
                    fillOpacity="0.72"
                    className="font-mono text-[9px] tracking-[0.08em]"
                  >
                    {node.label.toUpperCase()}
                  </text>

                  {/* =================================================
                      NODE NAME
                  ================================================== */}

                  <text
                    x="18"
                    y="53"
                    fill="white"
                    className="text-[16px] font-semibold tracking-[-0.02em]"
                  >
                    {node.name}
                  </text>

                  {/* =================================================
                      FOCUS BUTTON
                  ================================================== */}

                  <foreignObject
                    x={
                      width -
                      67
                    }
                    y={
                      height -
                      34
                    }
                    width="55"
                    height="26"
                  >
                    <button
                      type="button"
                      data-node-focus
                      className="h-6 w-[55px] rounded-full border border-white/25 bg-black/15 px-2 text-[12px] font-medium text-white/90 backdrop-blur-md transition hover:bg-black/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      onPointerDown={(
                        event,
                      ) => {
                        event.stopPropagation();
                      }}
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        onNodeSelect?.(
                          node,
                        );
                      }}
                    >
                      <p className="text-[12px]">Focus</p>
                    </button>
                  </foreignObject>

                  {/* =================================================
                      IDLE BREATHING
                  ================================================== */}

                  <animate
                    attributeName="opacity"
                    values={
                      visible
                        ? "0.97;1;0.97"
                        : "0.2;0.2;0.2"
                    }
                    dur={`${3.5 + (index % 4) * 0.45}s`}
                    repeatCount="indefinite"
                  />
                </g>
              );
            },
          )}
        </g>
      </svg>

      {/* =====================================================
          GRAPH HEADER
      ====================================================== */}

      <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-md">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Graph Explorer
        </p>

        <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          Explore your data as it
          actually connects.
        </p>
      </div>

      {/* =====================================================
          CONTROLS
      ====================================================== */}

      <div className="absolute bottom-5 left-5 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-2 text-[11px] text-[var(--text-secondary)] shadow-sm backdrop-blur-xl">
        Drag nodes · Drag canvas ·
        Scroll to zoom
      </div>

      <button
        type="button"
        onClick={resetView}
        className="absolute bottom-5 right-5 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-4 py-2 text-[11px] font-medium text-[var(--text-primary)] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Reset view
      </button>
    </div>
  );
}

export default GraphCanvas;