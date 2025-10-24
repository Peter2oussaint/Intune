const express = require("express");
const pool = require("../db");
const router = express.Router();

// Create - Updated to include key_info and bpm
router.post("/", async (req, res) => {
  const {
    user_id,
    song_title,
    artist_name,
    song_id,
    album_name,
    album_image_url,
    key_info,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO playlists(user_id, song_title, artist_name, song_id, album_name, album_image_url, key_info)
       VALUES($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        user_id,
        song_title,
        artist_name,
        song_id,
        album_name,
        album_image_url,
        key_info,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /api/playlists failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Read - Get user's playlist with all data including key info
router.get("/", async (req, res) => {
  const userId = req.query.user_id;
  try {
    const { rows } = await pool.query(
      `SELECT 
         id,
         user_id,
         song_title,
         artist_name,
         song_id,
         album_name,
         album_image_url,
         key_info,
         created_at
       FROM playlists 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/playlists failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete - Remove track from playlist
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rows } = await pool.query(
      "SELECT song_title, artist_name FROM playlists WHERE id = $1",
      [id]
    );

    if (rows.length > 0) {
      const track = rows[0];
      await pool.query("DELETE FROM playlists WHERE id = $1", [id]);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /api/playlists failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get playlist statistics
router.get("/stats/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const { rows } = await pool.query(
      `SELECT 
         COUNT(*) as total_tracks,
         COUNT(DISTINCT artist_name) as unique_artists,
         COUNT(DISTINCT album_name) as unique_albums,
         COUNT(*) FILTER (WHERE key_info->>'key' != 'Unknown') as tracks_with_key,
         COUNT(*) FILTER (WHERE key_info->>'bpm' != 'Unknown') as tracks_with_bpm,
       FROM playlists 
       WHERE user_id = $1`,
      [userId]
    );

    // Get most common keys
    const { rows: keyStats } = await pool.query(
      `SELECT 
         key_info->>'key' as musical_key,
         COUNT(*) as count
       FROM playlists 
       WHERE user_id = $1 AND key_info->>'key' != 'Unknown'
       GROUP BY key_info->>'key'
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    // Get most common artists
    const { rows: artistStats } = await pool.query(
      `SELECT 
         artist_name,
         COUNT(*) as track_count
       FROM playlists 
       WHERE user_id = $1
       GROUP BY artist_name
       ORDER BY track_count DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      overview: rows[0],
      top_keys: keyStats,
      top_artists: artistStats,
    });
  } catch (err) {
    console.error("Error getting playlist stats:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
