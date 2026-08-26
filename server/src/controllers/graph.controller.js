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

module.exports = {
  getDevelopers,
};