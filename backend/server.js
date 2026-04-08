require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/auth");
const ticketTypeRoutes = require("./routes/ticketTypes");
const entryRoutes = require("./routes/entries");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");

// Seed function
const { seedDatabase } = require("./prisma/seed"); // make sure your existing seed.js exports seedDatabase function

const app = express();

// CORS: allow frontend domain
app.use(cors({
  origin: ["https://trustworthy-recreation-production-6bab.up.railway.app"] // restrict to your frontend
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ticket-types", ticketTypeRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Parking POS API running" });
});

// TEMPORARY: Seed endpoint (use only once!)
app.get("/seed", async (req, res) => {
  try {
    await seedDatabase(); // call your existing seed logic
    res.send("✅ Database seeded successfully!");
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).send("❌ Seed failed: " + err.message);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});