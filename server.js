import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import Database_Connection from "./config/db.js";
import startScheduler from "./services/scheduler.js";
import errorHandler from "./middlewares/error.js";
import ruleEngine from "./services/RuleEngine.js"; 

import authRoutes from "./routes/authRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await Database_Connection();
    await ruleEngine.initStats();

    startScheduler();

    app.listen(PORT, () => {
      console.log("Server running on port:", PORT);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();