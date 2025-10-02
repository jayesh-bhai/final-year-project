import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();

// CORS middleware - must be before route definitions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

async function analyzeWithML(features) {
  try {
    const res = await fetch("http://localhost:6000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error("ML Service Error:", err.message);
    return { is_attack: 0, probability: 0 };
  }
}

app.post("/api/collect/frontend", async (req, res) => {
  console.log("Frontend Agent Data:", req.body);
  const analysis = await analyzeWithML(req.body);
  console.log("ML Analysis:", analysis);
  res.status(200).send({ status: "ok", analysis });
});

app.post("/api/collect/backend", async (req, res) => {
  console.log("Backend Agent Data:", req.body);
  const analysis = await analyzeWithML(req.body);
  console.log("ML Analysis:", analysis);
  res.status(200).send({ status: "ok", analysis });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(5000, () => {
  console.log("Collector API listening on http://localhost:5000");
});