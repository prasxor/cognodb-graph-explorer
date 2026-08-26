const express = require("express");
const cors = require("cors");

const graphRoutes = require("./routes/graph.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

app.use("/api/graph", graphRoutes);

app.use(errorMiddleware);

module.exports = app;