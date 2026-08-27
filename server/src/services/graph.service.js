const driver = require("../config/database");

const getDevelopers = async () => {
  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (developer:Developer)-[:WORKS_ON]->(project:Project)
      RETURN developer, collect(project) AS projects
      ORDER BY developer.name
    `);

    return result.records.map((record) => ({
      id: record.get("developer").properties.id,
      name: record.get("developer").properties.name,
      role: record.get("developer").properties.role,
      projects: record.get("projects").map((project) => ({
        id: project.properties.id,
        name: project.properties.name,
        status: project.properties.status,
      })),
    }));
  } finally {
    await session.close();
  }
};

const getGraphTraversal = async (developerId) => {
  const session = driver.session();

  try {
    const result = await session.run(
      `
  MATCH (start:Developer {id: $developerId})
  MATCH path = (start)-[*1..2]-(connected)

  WITH collect(path) AS paths

  UNWIND paths AS path
  UNWIND nodes(path) AS node
  WITH collect(DISTINCT node) AS nodes, paths

  UNWIND paths AS path
  UNWIND relationships(path) AS relationship

  RETURN nodes, collect(DISTINCT relationship) AS relationships
  `,

      { developerId },
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];

    return {
      nodes: record.get("nodes").map((node) => ({
        id: node.properties.id,
        label: node.labels[0],
        ...node.properties,
      })),
      relationships: record.get("relationships").map((relationship) => ({
        id: relationship.elementId,
        type: relationship.type,
        source: relationship.startNodeElementId,
        target: relationship.endNodeElementId,
      })),
    };
  } finally {
    await session.close();
  }
};

module.exports = {
  getDevelopers,
  getGraphTraversal,
};
