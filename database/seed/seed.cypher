MATCH (n)
DETACH DELETE n;

CREATE
  (rahul:Developer {
    id: "dev-1",
    name: "Rahul",
    role: "Backend Developer"
  }),
  (priya:Developer {
    id: "dev-2",
    name: "Priya",
    role: "Frontend Developer"
  }),
  (arjun:Developer {
    id: "dev-3",
    name: "Arjun",
    role: "Full Stack Developer"
  }),
  (meera:Developer {
    id: "dev-4",
    name: "Meera",
    role: "Data Engineer"
  }),

  (graphApi:Project {
    id: "project-1",
    name: "Graph API",
    status: "active"
  }),
  (dashboard:Project {
    id: "project-2",
    name: "Developer Dashboard",
    status: "active"
  }),
  (recommendation:Project {
    id: "project-3",
    name: "Recommendation Engine",
    status: "active"
  }),

  (node:Technology {
    id: "tech-1",
    name: "Node.js",
    category: "backend"
  }),
  (react:Technology {
    id: "tech-2",
    name: "React",
    category: "frontend"
  }),
  (neo4j:Technology {
    id: "tech-3",
    name: "Neo4j",
    category: "database"
  }),
  (python:Technology {
    id: "tech-4",
    name: "Python",
    category: "backend"
  });

CREATE
  (rahul)-[:WORKS_ON]->(graphApi),
  (rahul)-[:KNOWS]->(node),
  (rahul)-[:KNOWS]->(neo4j),

  (priya)-[:WORKS_ON]->(dashboard),
  (priya)-[:KNOWS]->(react),

  (arjun)-[:WORKS_ON]->(graphApi),
  (arjun)-[:WORKS_ON]->(dashboard),
  (arjun)-[:KNOWS]->(node),
  (arjun)-[:KNOWS]->(react),

  (meera)-[:WORKS_ON]->(recommendation),
  (meera)-[:KNOWS]->(python),
  (meera)-[:KNOWS]->(neo4j),

  (graphApi)-[:USES]->(node),
  (graphApi)-[:USES]->(neo4j),

  (dashboard)-[:USES]->(react),
  (dashboard)-[:DEPENDS_ON]->(graphApi),

  (recommendation)-[:USES]->(python),
  (recommendation)-[:USES]->(neo4j),
  (recommendation)-[:DEPENDS_ON]->(graphApi),

  (rahul)-[:COLLABORATES_WITH]->(arjun),
  (arjun)-[:COLLABORATES_WITH]->(priya),
  (meera)-[:COLLABORATES_WITH]->(rahul);