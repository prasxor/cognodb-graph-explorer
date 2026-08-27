export const createGraphNodes = (nodes) => {
  return nodes.map((node, index) => ({
    id: node.id,
    type: "graphNode",
    position: {
      x: (index % 4) * 220,
      y: Math.floor(index / 4) * 160,
    },
    data: node,
  }));
};

export const createGraphEdges = (relationships) => {
  return relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.source,
    target: relationship.target,
    label: relationship.type,
    animated: false,
  }));
};