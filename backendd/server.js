const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { initDatabase } = require("./db/db");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require("./Routes/AuthRoutes");
app.use("/api/auth", authRoutes);

const sprintPilotRoutes = require("./Routes/SprintPilotRoutes");
app.use("/api/sprintpilot", sprintPilotRoutes);

const sprintPlanRoutes = require("./Routes/Sprintplanroutes");
app.use("/api/sprintplan", sprintPlanRoutes);

// const documentRoutes = require("./Routes/UploadNewDocumentroutes");
// app.use("/api/documents", documentRoutes);

// Initialize DB
initDatabase()
  .then(() => console.log("DB connection initialized"))
  .catch((e) => console.error("DB init failed:", e.message));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));