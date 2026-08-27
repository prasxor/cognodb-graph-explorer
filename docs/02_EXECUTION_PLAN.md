# Wexa AI Take-Home --- Execution Plan

## Goal

Finish a polished, explainable graph-database application and submit it
before the 48-hour deadline.

## Phase 0 --- Understand & Decide

Status: IN PROGRESS

-   [x] Read the assignment.
-   [x] Extract mandatory requirements.
-   [ ] Choose a graph-native use case.
-   [ ] Define the primary user journey.
-   [ ] Confirm why a graph database is genuinely useful.

**Exit condition:** We can explain the project idea and why graph DB is
the right choice in under 60 seconds.

## Phase 1 --- Graph Design

Status: NOT STARTED

-   [ ] Define node labels.
-   [ ] Define relationship types.
-   [ ] Define properties.
-   [ ] Identify 2+ hop traversal.
-   [ ] Identify relationally awkward query.
-   [ ] Draft graph diagram.
-   [ ] Decide seed-data shape.

**Exit condition:** Complete graph model that can be explained before
coding.

## Phase 2 --- Technical Setup

Status: NOT STARTED

-   [ ] Create CognoDB account.
-   [ ] Create free instance.
-   [ ] Save URI/password securely.
-   [ ] Initialize repository.
-   [ ] Configure environment variables.
-   [ ] Install official Neo4j driver.
-   [ ] Verify first connection/query.

**Exit condition:** Application can connect to CognoDB safely.

## Phase 3 --- Backend & Data

Status: NOT STARTED

-   [ ] Establish backend structure.
-   [ ] Implement database connection layer.
-   [ ] Implement seed script.
-   [ ] Implement parameterized Cypher queries.
-   [ ] Implement API endpoints required by UI.
-   [ ] Add graceful database error handling.
-   [ ] Test required graph traversals.

**Exit condition:** API can provide all data needed by the UI.

## Phase 4 --- Frontend

Status: NOT STARTED

-   [ ] Build main layout.
-   [ ] Build primary exploration flow.
-   [ ] Add loading states.
-   [ ] Add empty states.
-   [ ] Add error states.
-   [ ] Make responsive.
-   [ ] Polish typography, spacing and interactions.

**Exit condition:** A non-technical user can understand and use the app
without explanation.

## Phase 5 --- Integration & QA

Status: NOT STARTED

-   [ ] Test fresh setup.
-   [ ] Test seed script.
-   [ ] Test all main flows.
-   [ ] Test invalid/empty data.
-   [ ] Test database unavailable state.
-   [ ] Verify no secrets are committed.
-   [ ] Verify required Cypher is parameterized.
-   [ ] Verify 2+ hop query.
-   [ ] Verify relationally awkward query.
-   [ ] Review code for interview explainability.

## Phase 6 --- Deployment

Status: NOT STARTED

-   [ ] Deploy frontend/backend as needed.
-   [ ] Configure production environment variables.
-   [ ] Connect production app to CognoDB.
-   [ ] Test hosted demo.
-   [ ] Keep CognoDB instance running.

## Phase 7 --- Submission

Status: NOT STARTED

-   [ ] Complete README.
-   [ ] Add graph model diagram.
-   [ ] Explain "Why a graph database?"
-   [ ] Explain main queries.
-   [ ] Add UI screenshots.
-   [ ] Record short demo.
-   [ ] Verify GitHub repository.
-   [ ] Verify hosted demo.
-   [ ] Send email to hr@wexa.ai.
-   [ ] Use subject: `CognoDB Assignment 2 – <Your Name>`.

## Priority Rule

If time becomes tight, prioritize: 1. Working end-to-end application. 2.
Correct graph model and required queries. 3. Deployment. 4.
README/submission requirements. 5. UI polish. 6. Extra features.

Do not add features that do not improve the assignment evaluation.
