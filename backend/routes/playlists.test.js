/**
 * Unit tests for Playlists API Routes
 * Tests CRUD operations and statistics endpoints
 */

const request = require("supertest");
const app = require("../server");

// Mock the database pool
jest.mock("../db", () => ({
  query: jest.fn(),
}));

const pool = require("../db");

describe("Playlists API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/playlists", () => {
    test("creates new playlist entry and returns ID", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 123 }] });

      const playlistData = {
        user_id: "user-abc-123",
        song_title: "Anti-Hero",
        artist_name: "Taylor Swift",
        song_id: "spotify:track:xyz",
        album_name: "Midnights",
        album_image_url: "https://example.com/album.jpg",
        key_info: JSON.stringify({ key: "F Major", bpm: "96" }),
      };

      const res = await request(app).post("/api/playlists").send(playlistData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: 123 });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO playlists"),
        [
          "user-abc-123",
          "Anti-Hero",
          "Taylor Swift",
          "spotify:track:xyz",
          "Midnights",
          "https://example.com/album.jpg",
          JSON.stringify({ key: "F Major", bpm: "96" }),
        ]
      );
    });

    test("handles missing optional fields gracefully", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 456 }] });

      const minimalData = {
        user_id: "user-123",
        song_title: "Test Song",
        artist_name: "Test Artist",
        song_id: "spotify:123",
      };

      const res = await request(app).post("/api/playlists").send(minimalData);

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBe(456);
    });

    test("handles database errors with 500 status", async () => {
      pool.query.mockRejectedValueOnce(new Error("Database connection failed"));

      const res = await request(app).post("/api/playlists").send({
        user_id: "user-123",
        song_title: "Test Song",
        artist_name: "Test Artist",
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toContain("Database connection failed");
    });

    test("handles duplicate song_id constraint violation", async () => {
      pool.query.mockRejectedValueOnce({
        message: "duplicate key value violates unique constraint",
        code: "23505",
      });

      const res = await request(app).post("/api/playlists").send({
        user_id: "user-123",
        song_title: "Duplicate Song",
        artist_name: "Artist",
        song_id: "spotify:duplicate",
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/playlists", () => {
    test("retrieves user playlist with all fields", async () => {
      const mockPlaylist = [
        {
          id: 1,
          user_id: "user-123",
          song_title: "Song 1",
          artist_name: "Artist 1",
          song_id: "spotify:1",
          album_name: "Album 1",
          album_image_url: "https://example.com/album1.jpg",
          key_info: { key: "C Major", bpm: "120" },
          created_at: "2024-01-15T10:30:00Z",
        },
        {
          id: 2,
          user_id: "user-123",
          song_title: "Song 2",
          artist_name: "Artist 2",
          song_id: "spotify:2",
          album_name: "Album 2",
          album_image_url: "https://example.com/album2.jpg",
          key_info: { key: "G Major", bpm: "128" },
          created_at: "2024-01-15T11:00:00Z",
        },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockPlaylist });

      const res = await request(app).get("/api/playlists?user_id=user-123");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockPlaylist);
      expect(res.body.length).toBe(2);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["user-123"]
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC"),
        expect.any(Array)
      );
    });

    test("returns empty array for user with no playlist items", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/api/playlists?user_id=new-user");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("handles missing user_id query parameter", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/api/playlists");

      expect(res.statusCode).toBe(200);
      // Query should be called with undefined, which DB will handle
      expect(pool.query).toHaveBeenCalled();
    });

    test("handles database errors with 500 status", async () => {
      pool.query.mockRejectedValueOnce(new Error("Connection timeout"));

      const res = await request(app).get("/api/playlists?user_id=user-123");

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/playlists/:id", () => {
    test("successfully deletes track from playlist", async () => {
      // First query: SELECT to check if track exists
      pool.query.mockResolvedValueOnce({
        rows: [{ song_title: "Test Song", artist_name: "Test Artist" }],
      });
      // Second query: DELETE
      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app).delete("/api/playlists/42");

      expect(res.statusCode).toBe(204);
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SELECT"),
        [42]
      );
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("DELETE"),
        [42]
      );
    });

    test("returns 204 even if track does not exist", async () => {
      // First query: SELECT returns empty
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).delete("/api/playlists/999");

      expect(res.statusCode).toBe(204);
      // DELETE should not be called if track doesn't exist
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test("handles non-numeric ID gracefully", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).delete("/api/playlists/invalid-id");

      // Should attempt to parse and query with NaN or 0
      expect(res.statusCode).toBe(204);
    });

    test("handles database errors with 500 status", async () => {
      pool.query.mockRejectedValueOnce(new Error("Database error"));

      const res = await request(app).delete("/api/playlists/1");

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/playlists/stats/:userId", () => {
    test("returns complete playlist statistics", async () => {
      // Mock overview query
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            total_tracks: 25,
            unique_artists: 15,
            unique_albums: 20,
            tracks_with_key: 23,
            tracks_with_bpm: 22,
          },
        ],
      });

      // Mock top keys query
      pool.query.mockResolvedValueOnce({
        rows: [
          { musical_key: "C Major", count: 5 },
          { musical_key: "G Major", count: 4 },
          { musical_key: "A Minor", count: 3 },
        ],
      });

      // Mock top artists query
      pool.query.mockResolvedValueOnce({
        rows: [
          { artist_name: "Taylor Swift", track_count: 4 },
          { artist_name: "The Beatles", track_count: 3 },
          { artist_name: "Radiohead", track_count: 2 },
        ],
      });

      const res = await request(app).get("/api/playlists/stats/user-123");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("overview");
      expect(res.body).toHaveProperty("top_keys");
      expect(res.body).toHaveProperty("top_artists");

      expect(res.body.overview.total_tracks).toBe(25);
      expect(res.body.overview.unique_artists).toBe(15);
      expect(res.body.top_keys.length).toBe(3);
      expect(res.body.top_artists.length).toBe(3);

      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    test("returns empty statistics for user with no tracks", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            total_tracks: 0,
            unique_artists: 0,
            unique_albums: 0,
            tracks_with_key: 0,
            tracks_with_bpm: 0,
          },
        ],
      });
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/api/playlists/stats/new-user");

      expect(res.statusCode).toBe(200);
      expect(res.body.overview.total_tracks).toBe(0);
      expect(res.body.top_keys).toEqual([]);
      expect(res.body.top_artists).toEqual([]);
    });

    test("handles database errors with 500 status", async () => {
      pool.query.mockRejectedValueOnce(new Error("Query failed"));

      const res = await request(app).get("/api/playlists/stats/user-123");

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty("error");
    });

    test("statistics queries use correct SQL filters", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{}] });
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      await request(app).get("/api/playlists/stats/user-xyz");

      // Check that all queries use the correct user_id
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE user_id = $1"),
        ["user-xyz"]
      );
    });

    test("returns top 5 keys and artists as specified", async () => {
      const manyKeys = Array.from({ length: 10 }, (_, i) => ({
        musical_key: `Key ${i}`,
        count: 10 - i,
      }));
      const manyArtists = Array.from({ length: 10 }, (_, i) => ({
        artist_name: `Artist ${i}`,
        track_count: 10 - i,
      }));

      pool.query.mockResolvedValueOnce({ rows: [{}] });
      pool.query.mockResolvedValueOnce({ rows: manyKeys.slice(0, 5) });
      pool.query.mockResolvedValueOnce({ rows: manyArtists.slice(0, 5) });

      const res = await request(app).get("/api/playlists/stats/user-123");

      expect(res.statusCode).toBe(200);
      expect(res.body.top_keys.length).toBe(5);
      expect(res.body.top_artists.length).toBe(5);
    });
  });
});
