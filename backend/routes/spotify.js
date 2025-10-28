const express = require("express");
const router = express.Router();
const pool = require("../db");
require("dotenv").config();

// Services
const ChatGPTCompatibilityService = require("../services/chatgptCompatibility");
const chatgptService = new ChatGPTCompatibilityService();

const HarmonicCompatibilityEngine = require("../services/harmonicCompatibility");
const MusicDataScraper = require("../services/musicDataScraper");

const harmonicEngine = new HarmonicCompatibilityEngine();
const musicDataScraper = new MusicDataScraper();

async function getToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) throw new Error("Spotify token request failed");
  return (await resp.json()).access_token;
}

async function searchSpotifyTrack(artist, song, token) {
  const q = encodeURIComponent(`${song} artist:${artist}`);
  const resp = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await resp.json();
  return data?.tracks?.items?.[0] || null;
}

async function searchSpotifyArtist(artistName, token) {
  const q = encodeURIComponent(artistName);
  const resp = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await resp.json();
  return data?.artists?.items?.[0] || null;
}

async function getArtistTopTracks(artistId, token, limit = 10) {
  const resp = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await resp.json();
  return data.tracks || [];
}

// Function to search multiple tracks efficiently
async function batchSearchSpotifyTracks(trackQueries, token, batchSize = 5) {
  const results = [];

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < trackQueries.length; i += batchSize) {
    const batch = trackQueries.slice(i, i + batchSize);

    const batchPromises = batch.map(async ({ artist, song, index }) => {
      try {
        // Add small delay between requests in batch
        await new Promise((resolve) => setTimeout(resolve, index * 50));

        const spotifyTrack = await searchSpotifyTrack(artist, song, token);
        return { index, spotifyTrack, artist, song };
      } catch (error) {
        return { index, spotifyTrack: null, artist, song };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Delay between batches
    if (i + batchSize < trackQueries.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

async function getSoundNetAnalysis(trackName, artistName) {
  const url = new URL("https://track-analysis.p.rapidapi.com/pktx/analysis");
  url.searchParams.set("song", trackName);
  url.searchParams.set("artist", artistName);
  const resp = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": process.env.SOUNDNET_API_KEY || "",
      "X-RapidAPI-Host": "track-analysis.p.rapidapi.com",
    },
  });
  if (!resp.ok) return { key: "Unknown", bpm: "Unknown", source: "SoundNet" };
  const json = await resp.json();

  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  let key = "Unknown";
  if (json.key != null) {
    const k =
      typeof json.key === "number" ? names[json.key] || json.key : json.key;
    const m = json.mode === "major" || json.mode === 1 ? "Major" : "Minor";
    key = `${k} ${m}`;
  }
  let bpm = "Unknown";
  if (json.tempo) bpm = String(Math.round(json.tempo));

  return { key, bpm, source: "SoundNet" };
}

// ===== Route: track search with compatible tracks =====
router.get("/track/:artist/:song", async (req, res) => {
  const { artist, song } = req.params;
  try {
    const token = await getToken();
    const spotifyTrack = await searchSpotifyTrack(artist, song, token);
    if (!spotifyTrack)
      return res.status(404).json({ error: "Track not found on Spotify" });

    // SoundNet for key/BPM
    const soundnet = await getSoundNetAnalysis(song, artist);
    const key_info = {
      key: soundnet.key || "Unknown",
      bpm: soundnet.bpm || "Unknown",
      source: "SoundNet",
    };
    const main_track = {
      ...spotifyTrack,
      key_info,
    };

    let compatible_tracks = [];
    const hasKey = key_info.key !== "Unknown";
    const hasBpm = key_info.bpm !== "Unknown";

    if (hasKey && hasBpm) {
      try {
        const gptTracks = await chatgptService.findCompatibleTracks(
          main_track,
          20
        );
        const spotifyResults = await batchSearchSpotifyTracks(
          gptTracks.map((t, i) => ({
            artist: t.artist,
            song: t.name || t.song,
            index: i,
          })),
          token
        );
        compatible_tracks = spotifyResults.map(({ spotifyTrack }, i) => ({
          ...spotifyTrack,
          key_info: {
            key: gptTracks[i].estimated_key || gptTracks[i].key || "Unknown",
            bpm: gptTracks[i].estimated_bpm || gptTracks[i].bpm || "Unknown",
            source: "ChatGPT",
          },
        }));
      } catch (err) {
        compatible_tracks = await harmonicEngine.findCompatibles(main_track);
      }
    } else {
      compatible_tracks = await harmonicEngine.findCompatibles(main_track);
    }

    res.json({ main_track, compatible_tracks });
  } catch (err) {
    console.error("Spotify track route error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
