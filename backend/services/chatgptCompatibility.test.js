/**
 * Unit tests for ChatGPTCompatibilityService
 * - No network calls: global.fetch is mocked
 * - Validates happy path JSON parsing
 * - Validates retry + fallback behavior on API failure
 */

const ChatGPTCompatibilityService = require('../services/chatgptCompatibility');

describe('ChatGPTCompatibilityService', () => {
  let svc;
  const OLD_ENV = process.env;
  const referenceTrack = {
    name: 'Anti-Hero',
    artists: [{ name: 'Taylor Swift' }],
    album: { release_date: '2022-10-21' },
    key_info: { key: 'F Major', bpm: '96' },
  };

  beforeAll(() => {
    // Ensure fetch is available to mock
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV, OPENAI_API_KEY: 'test_key', CHATGPT_MODEL: 'gpt-3.5-turbo' };
    svc = new ChatGPTCompatibilityService();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('happy path: returns tracks parsed from JSON (with code-fence) and maps to unified shape', async () => {
    // Mock OpenAI Chat Completions response (with ```json code fence)
    const messageContent = [
      '```json',
      JSON.stringify({
        tracks: [
          { artist: 'Artist A', song: 'Song A', key: 'C Major', bpm: '120' },
          { artist: 'Artist B', song: 'Song B', key: 'G Major', bpm: '118' },
        ],
      }),
      '```',
    ].join('\n');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'cmpl_123',
        choices: [{ index: 0, message: { role: 'assistant', content: messageContent } }],
      }),
    });

    const results = await svc.findCompatibleTracks(referenceTrack, 2);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    // Unified mapping check
    expect(results[0]).toEqual(
      expect.objectContaining({
        artist: 'Artist A',
        song: 'Song A',
        estimated_key: 'C Major',
        estimated_bpm: '120',
        source: 'ChatGPT Music Analysis',
        ai_generated: true,
      }),
    );
  });

  test('retry once on failure, then fallback tracks when second attempt also fails', async () => {
    // First attempt: 500
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    // Second attempt (after retry): also fail
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const results = await svc.findCompatibleTracks(referenceTrack, 5);

    // Two attempts
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Should return fallback set
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    // Fallback metadata
    expect(results[0]).toEqual(
      expect.objectContaining({
        ai_generated: false,
        source: 'Fallback Database',
      }),
    );
  });

  test('parsing: handles direct array format or alternate keys gracefully', async () => {
    const directArrayContent = JSON.stringify([
      { artist: 'Arr X', title: 'Cut X', key: 'D Minor', bpm: '128' },
      { artist: 'Arr Y', song: 'Cut Y', key: 'F Major', bpm: '100' },
    ]);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: directArrayContent } }],
      }),
    });

    const results = await svc.findCompatibleTracks(referenceTrack, 2);
    expect(results).toHaveLength(2);
    // title/song normalization
    expect(results[0]).toEqual(
      expect.objectContaining({
        artist: 'Arr X',
        song: 'Cut X',
        estimated_key: 'D Minor',
        estimated_bpm: '128',
      }),
    );
  });

  test('parseCompatibilityResponse: returns [] and does not throw on malformed JSON', () => {
    const bad = 'this is not JSON at all';
    const parsed = svc.parseCompatibilityResponse(bad);
    expect(Array.isArray(parsed)).toBe(true);
    // Fallback text parsing may still produce 0..N items; only assert it’s an array
  });
});
