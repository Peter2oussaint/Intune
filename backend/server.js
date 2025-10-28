const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const pool = require("./db");

// CORS 
app.use(cors({
  origin: [
    'https://intune-zeta.vercel.app', 
    'http://localhost:3000'
  ],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const spotifyRoutes = require("./routes/spotify");
const playlistsRoutes = require("./routes/playlists");
const usersRoutes = require("./routes/users");

app.use("/api/spotify", spotifyRoutes);
app.use("/api/playlists", playlistsRoutes);
app.use("/api/users", usersRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: "DB connection error" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;

// Boot when run directly
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);  
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received: closing server…`);  
    server.close(async () => {
      try {
        await pool.end();
        console.log("DB pool closed. Bye.");
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}