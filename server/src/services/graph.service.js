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

module.exports = {
  getDevelopers,
};