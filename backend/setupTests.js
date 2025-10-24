/**
 * Backend Test Setup Configuration
 * 
 * This file runs before all backend tests to set up the test environment.
 * It mocks external APIs, configures global settings, and provides test utilities.
 */

// ============================================
// GLOBAL FETCH MOCK
// ============================================
// Mock fetch for API calls (Spotify, OpenAI, SoundNet, etc.)
global.fetch = jest.fn();

// Helper to reset fetch mock between tests
global.resetFetchMock = () => {
  global.fetch.mockReset();
};

// ============================================
// ENVIRONMENT VARIABLES
// ============================================
// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock API keys (prevent real API calls in tests)
process.env.SPOTIFY_CLIENT_ID = 'test_spotify_client_id';
process.env.SPOTIFY_CLIENT_SECRET = 'test_spotify_client_secret';
process.env.OPENAI_API_KEY = 'test_openai_api_key';
process.env.SOUNDNET_API_KEY = 'test_soundnet_api_key';
process.env.CHATGPT_MODEL = 'gpt-3.5-turbo';

// Database connection (if needed for integration tests)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/intune_test';

// API base URL
process.env.REACT_APP_API_URL = 'http://localhost:4000';

// ============================================
// CONSOLE SUPPRESSION (Optional)
// ============================================
// Suppress console.error and console.warn during tests to keep output clean
// Comment out if you need to debug
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message) => {
    // Still log errors that aren't expected test errors
    if (
      !message.includes('Warning: ReactDOM.render') &&
      !message.includes('Not implemented: HTMLFormElement.prototype.submit')
    ) {
      originalError(message);
    }
  });

  console.warn = jest.fn((message) => {
    // Log warnings that matter
    if (!message.includes('componentWillReceiveProps')) {
      originalWarn(message);
    }
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// ============================================
// GLOBAL TEST TIMEOUT
// ============================================
// Increase timeout for slower tests (API mocks, etc.)
jest.setTimeout(10000); // 10 seconds

// ============================================
// MOCK DATA HELPERS
// ============================================
// Reusable mock data for tests
global.mockSpotifyToken = {
  access_token: 'mock_spotify_token_123',
  token_type: 'Bearer',
  expires_in: 3600,
};

global.mockSpotifyTrack = {
  id: 'spotify:track:mock123',
  name: 'Mock Song',
  artists: [{ name: 'Mock Artist', id: 'artist123' }],
  album: {
    name: 'Mock Album',
    images: [{ url: 'http://example.com/album.jpg' }],
    release_date: '2024-01-01',
  },
  preview_url: 'http://example.com/preview.mp3',
  duration_ms: 210000,
  explicit: false,
  popularity: 75,
};

global.mockSoundNetResponse = {
  key: 0, // C
  mode: 'major',
  tempo: 120,
  time_signature: 4,
  energy: 0.8,
  danceability: 0.75,
};

global.mockChatGPTResponse = {
  id: 'chatcmpl-123',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-3.5-turbo',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          tracks: [
            {
              artist: 'Mock Artist 1',
              song: 'Mock Song 1',
              key: 'C Major',
              bpm: '120',
            },
            {
              artist: 'Mock Artist 2',
              song: 'Mock Song 2',
              key: 'G Major',
              bpm: '118',
            },
          ],
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 150,
    total_tokens: 250,
  },
};

// ============================================
// FETCH MOCK HELPERS
// ============================================
// Helper functions to mock common API responses

global.mockSpotifyAuth = () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => global.mockSpotifyToken,
  });
};

global.mockSpotifySearch = (track = global.mockSpotifyTrack) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      tracks: {
        items: [track],
        total: 1,
        limit: 1,
        offset: 0,
      },
    }),
  });
};

global.mockSoundNetAPI = (response = global.mockSoundNetResponse) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => response,
  });
};

global.mockChatGPTAPI = (response = global.mockChatGPTResponse) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => response,
  });
};

global.mockAPIError = (statusCode = 500, message = 'Internal Server Error') => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: statusCode,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => message,
  });
};

// ============================================
// DATABASE MOCK HELPERS
// ============================================
// Mock database responses (for use with jest.mock('../db'))

global.mockDBQuery = (rows = [], rowCount = null) => ({
  rows,
  rowCount: rowCount !== null ? rowCount : rows.length,
  command: 'SELECT',
  fields: [],
});

global.mockDBInsert = (id = 1) => ({
  rows: [{ id }],
  rowCount: 1,
  command: 'INSERT',
});

global.mockDBUpdate = (rowCount = 1) => ({
  rows: [],
  rowCount,
  command: 'UPDATE',
});

global.mockDBDelete = (rowCount = 1) => ({
  rows: [],
  rowCount,
  command: 'DELETE',
});

global.mockDBError = (message = 'Database error') => {
  const error = new Error(message);
  error.code = '23505'; // Unique constraint violation
  return error;
};

// ============================================
// TEST UTILITIES
// ============================================

// Wait for async operations
global.waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Create mock Express request
global.mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

// Create mock Express response
global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// Create mock Express next function
global.mockNext = () => jest.fn();

// ============================================
// CLEANUP
// ============================================
// Reset all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
  global.resetFetchMock();
});

// ============================================
// CUSTOM MATCHERS
// ============================================
// Add custom Jest matchers for backend testing

expect.extend({
  toBeValidTrack(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      received.id &&
      received.name &&
      Array.isArray(received.artists) &&
      received.artists.length > 0;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid track`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid track (with id, name, and artists)`,
        pass: false,
      };
    }
  },

  toHaveKeyInfo(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      received.key_info &&
      (received.key_info.key || received.key_info.bpm);

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have key_info`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have key_info with key or bpm`,
        pass: false,
      };
    }
  },

  toBeValidCompatibilityScore(received) {
    const pass =
      typeof received === 'number' &&
      received >= 0 &&
      received <= 100;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid compatibility score`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a number between 0 and 100`,
        pass: false,
      };
    }
  },
});

// ============================================
// READY MESSAGE
// ============================================
console.log('🧪 Backend test environment initialized');
console.log('   • Fetch API mocked');
console.log('   • Environment variables set');
console.log('   • Mock helpers available');
console.log('   • Custom matchers loaded');
console.log('');