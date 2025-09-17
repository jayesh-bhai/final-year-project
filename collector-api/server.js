import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

// Endpoint for frontend agent
app.post("/api/collect/frontend", (req, res) => {
  console.log("Frontend Agent Data:", req.body);
  res.status(200).send({ status: "ok" });
});

// Endpoint for backend agent
app.post("/api/collect/backend", (req, res) => {
  console.log("Backend Agent Data:", req.body);
  res.status(200).send({ status: "ok" });
});

app.listen(5000, () => {
  console.log("Collector API listening on http://localhost:5000");
});
