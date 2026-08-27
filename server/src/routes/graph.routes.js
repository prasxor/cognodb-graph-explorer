const express = require("express");

const graphController = require("../controllers/graph.controller");

const router = express.Router();

router.get("/developers", graphController.getDevelopers);

router.get(
  "/traverse/:developerId",
  graphController.getGraphTraversal
);

module.exports = router;