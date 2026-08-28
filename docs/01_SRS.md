# Wexa AI Take-Home --- Software Requirements Specification

## 1. Project

**Working title:** TBD\
**Assignment:** Build a Graph Database Application\
**Company:** Wexa AI\
**Role:** Software Engineer (Full-Stack / Web)

## 2. Source of Truth

This SRS is derived from the Wexa AI take-home assignment PDF received
on August 26, 2026. The assignment requires a small, complete
application backed by CognoDB.

## 3. Objective

Build a functional web application backed by a graph database using
CognoDB as the data layer. The application idea is our choice, but it
must demonstrate meaningful graph data modeling and relationship-based
queries.

## 4. Mandatory Requirements

### 4.1 Database & Data

-   Use CognoDB as the graph database.
-   Connect through the official Neo4j driver.
-   Use openCypher over Bolt.
-   Create a thoughtful graph data model.
-   Use labeled nodes.
-   Use typed relationships.
-   Include properties where appropriate.
-   Document the model with a simple diagram in the README.
-   Include realistic or real seed data.
-   Include a seed/data-loading script in the repository.
-   Include Cypher queries.
-   Include at least one 2-hop-or-more graph traversal.
-   Include at least one query that would be awkward in a relational
    database.
-   Use parameterized queries; never concatenate user input into Cypher.

### 4.2 Application & UI/UX

-   Build a functional web application.
-   A non-technical person must be able to explore the chosen use case.
-   Provide a clean and intentional UI/UX.
-   Include sensible layout and navigation.
-   Include loading states.
-   Include empty states.
-   Include readable typography.
-   Design effort is explicitly evaluated.

### 4.3 Engineering

-   Read CognoDB URI and password from environment variables.
-   Never commit database credentials.
-   Use a clear project structure.
-   Code should be explainable line-by-line in an interview.
-   Handle database-unreachable failures gracefully.

### 4.4 Deliverables

-   GitHub repository.
-   Full source code.
-   Application code.
-   Data-loading/seed scripts.
-   Cypher queries.
-   README containing:
    -   use case
    -   "Why a graph database?"
    -   data model diagram
    -   setup/run instructions
    -   CognoDB creation instructions
    -   main queries explained
    -   UI screenshots
-   Hosted application demo link --- mandatory.
-   Short screen recording --- mandatory.
-   Submit repository URL and demo link to hr@wexa.ai.
-   Email subject: `CognoDB Assignment 2 – <Your Name>`.
-   Keep the CognoDB instance running until Wexa responds.

## 5. Constraints

-   Assignment deadline: 48 hours from receipt.
-   CognoDB free tier is limited, so the dataset should remain
    appropriately small.
-   The exact application idea is intentionally not prescribed.

## 6. Non-Goals

Unless the chosen use case requires them, do not spend time on: -
advanced graph algorithms - complex distributed systems - custom
database infrastructure - custom CognoDB SDKs - unnecessary
enterprise-level abstractions

## 7. Open Decisions

These must be decided before implementation: - Application/use-case -
Graph node types - Relationship types - Node/relationship properties -
Frontend stack - Backend stack - Hosting provider - Seed-data source -
Main user flow - Required Cypher queries - Graph-model diagram format

## 8. Acceptance Criteria

The project is complete only when: - The app works end-to-end. - CognoDB
is connected successfully. - Seed data can be loaded. - Required graph
queries execute successfully. - The UI is usable without technical
knowledge. - Errors/loading/empty states are handled. - Secrets are
externalized. - README is complete. - Demo is deployed. - Screen
recording is complete. - Repository is ready to submit.
