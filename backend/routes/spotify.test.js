const request = require("supertest");
const app = require("../server");

/**
 * Test 1: Normal flow
 * - SoundNet returns valid key/BPM
 * - ChatGPT compatibility service provides compatible tracks
 * - Spotify returns those tracks successfully
 */
jest.mock("../services/chatgptCompatibility", () => {
  return jest.fn().mockImplementation(() => ({
    findCompatibleTracks: jest.fn().mockResolvedValue([
      {
        artist: "Test Artist A",
        name: "Test Song A",
        estimated_key: "C Major",
        estimated_bpm: "120",
      },
      {
        artist: "Test Artist B",
        name: "Test Song B",
        estimated_key: "G Major",
        estimated_bpm: "118",
      },
    ]),
  }));
});

// Global fetch mock
global.fetch = jest.fn();

describe("Spotify Route Integration", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("returns main track with ChatGPT-compatible tracks when SoundNet provides valid data", async () => {
    // token
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: "MOCK_TOKEN" }),
    });
    // main track search
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          tracks: {
            items: [
              {
                id: "SPOTIFY_MAIN",
                name: "Reference Track",
                artists: [{ name: "Ref Artist" }],
              },
            ],
          },
        }),
    });
    // SoundNet with valid data
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ key: 0, mode: "major", tempo: 120 }),
    });
    // Spotify lookups for GPT tracks
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          tracks: {
            items: [
              {
                id: "SPOTIFY_GPT_1",
                name: "Test Song A",
                artists: [{ name: "Test Artist A" }],
              },
            ],
          },
        }),
    });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          tracks: {
            items: [
              {
                id: "SPOTIFY_GPT_2",
                name: "Test Song B",
                artists: [{ name: "Test Artist B" }],
              },
            ],
          },
        }),
    });

    const res = await request(app).get(
      "/api/spotify/track/Ref%20Artist/Reference%20Track"
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("main_track");
    expect(res.body).toHaveProperty("compatible_tracks");
    expect(Array.isArray(res.body.compatible_tracks)).toBe(true);

    expect(res.body.main_track).toEqual(
      expect.objectContaining({
        id: "SPOTIFY_MAIN",
        name: "Reference Track",
        key_info: expect.objectContaining({
          source: "SoundNet",
          key: expect.any(String),
          bpm: expect.any(String),
        }),
      })
    );

    expect(res.body.compatible_tracks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "SPOTIFY_GPT_1",
          name: "Test Song A",
          key_info: expect.objectContaining({ source: "ChatGPT" }),
        }),
        expect.objectContaining({
          id: "SPOTIFY_GPT_2",
          name: "Test Song B",
          key_info: expect.objectContaining({ source: "ChatGPT" }),
        }),
      ])
    );

    expect(fetch).toHaveBeenCalledTimes(5);
  });
});

/**
 * Test 2: Harmonic fallback flow
 * - SoundNet request fails
 * - Harmonic engine provides fallback compatible tracks
 */
jest.mock("../services/harmonicCompatibility", () => {
  return jest.fn().mockImplementation(() => ({
    findCompatibleTracks: jest.fn().mockResolvedValue([
      {
        id: "HARMONIC_1",
        name: "Fallback Track 1",
        artists: [{ name: "Artist X" }],
        key_info: { key: "G Major", bpm: "120", source: "Harmonic" },
      },
    ]),
  }));
});

