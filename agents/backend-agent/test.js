import express from "express";
import { backendAgentMiddleware } from "./src/index.js";

const app = express();

app.use(express.json());
app.use(backendAgentMiddleware);

app.get("/", (req, res) => {
  res.send("Hello from backend test!");
});

app.listen(4000, () => {
  console.log("Backend test app running on http://localhost:4000");
});
