const graphService = require("../services/graph.service");

const getDevelopers = async (req, res, next) => {
  try {
    const developers = await graphService.getDevelopers();

    res.json({
      success: true,
      data: developers,
    });
  } catch (error) {
    next(error);
  }
};

const getGraphTraversal = async (req, res, next) => {
  try {
    const graph = await graphService.getGraphTraversal(
      req.params.developerId
    );

    if (!graph) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    res.json({
      success: true,
      data: graph,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevelopers,
  getGraphTraversal,
};