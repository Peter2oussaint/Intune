/**
 * Unit tests for services/musicDataScraper.js
 * - No network calls: global.fetch is mocked
 * - Exercises current, supported surface only
 */

const MusicDataScraper = require("../services/musicDataScraper");

describe("MusicDataScraper", () => {
  let scraper;

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    scraper = new MusicDataScraper();
  });

  test("getScrapedMusicData: returns basic structure with Unknown key/bpm", async () => {
    const res = await scraper.getScrapedMusicData("Taylor Swift", "Anti-Hero");
    expect(res).toEqual(
      expect.objectContaining({
        key: "Unknown",
        bpm: "Unknown",
        source: "Basic Data Service",
        scraping_success: false,
        data_quality: "basic",
        note: expect.any(String),
      })
    );
  });

  test("scrapeTunebatPage: parses key/bpm from HTML (happy path)", async () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <script type="application/ld+json">
            {"key":"C Major","tempo":120}
          </script>
          <div>Some content</div>
        </body>
      </html>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const res = await scraper.scrapeTunebatPage(
      "https://example.com/tunebat/test"
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ key: "C Major", bpm: "120" });
  });

  test("scrapeTunebatPage: supports unicode key symbols and normalizes", async () => {
    const html = `
      <div>Key: F♯ minor</div>
      <div>Tempo: 128 BPM</div>
    `;
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    });

    const res = await scraper.scrapeTunebatPage(
      "https://example.com/tunebat/unicode"
    );
    expect(res).toEqual({ key: "F# Minor", bpm: "128" });
  });

  test("scrapeTunebatPage: returns null on non-ok fetch", async () => {
    fetch.mockResolvedValueOnce({ ok: false, text: async () => "" });
    const res = await scraper.scrapeTunebatPage("https://example.com/fail");
    expect(res).toBeNull();
  });

  test("isDefinitelyNotASong and isNoiseText: filter obvious non-song text", () => {
    expect(scraper.isDefinitelyNotASong("Home")).toBe(true);
    expect(scraper.isDefinitelyNotASong("Privacy Policy")).toBe(true);
    expect(scraper.isNoiseText("12345")).toBe(true);
    expect(scraper.isNoiseText("https://example.com")).toBe(true);
    expect(scraper.isNoiseText("Just a normal sentence with letters")).toBe(
      false
    );
  });

  test("cleanSongTitle: strips artist and noise, normalizes spacing", () => {
    const cleaned = scraper.cleanSongTitle(
      "Taylor Swift — 'Anti-Hero' (Official Video)",
      "Taylor Swift"
    );
    expect(cleaned).toBe("'Anti-Hero' Official Video");
  });

  test("extractNearbyText/textDistance: basic utilities behave", () => {
    const text = "The song Anti-Hero by Taylor Swift has a tempo of 96 BPM.";
    const snippet = scraper.extractNearbyText(text, "Anti-Hero", 10);
    expect(snippet.length).toBeGreaterThan(0);

    const dist = scraper.textDistance(text.toLowerCase(), "anti-hero", "swift");
    expect(dist).toBeGreaterThan(0);
  });

  test("cleanup: no-op and does not throw", async () => {
    await expect(scraper.cleanup()).resolves.not.toThrow;
  });
});
