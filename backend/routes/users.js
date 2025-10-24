const express = require("express");
const pool = require("../db");
const router = express.Router();

// Create user record if it doesn't exist
router.post("/", async (req, res) => {
  const { id, email } = req.body;

  try {
    await pool.query(
      `INSERT INTO users (id, email)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [id, email]
    );

    res.sendStatus(204); // No content: successful request, nothing to return
  } catch (err) {
    console.error("POST /api/users failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
