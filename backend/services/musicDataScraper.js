/**
 * Simplified Music Data Service
 * Focuses on basic music data retrieval from reliable sources
 * Google scraping removed - replaced by ChatGPT compatibility service
 */

class MusicDataScraper {
  constructor() {
    this.requestDelay = 1000; // 1 second between requests to be respectful
    this.userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  async scrapeTunebatPage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html",
        },
      });

      if (!response.ok) return null;

      const html = await response.text();

      // Try multiple patterns to extract key
      let key = null;
      let bpm = null;

      // Pattern 1: Look for key with unicode symbols
      const keyPattern1 = html.match(/([A-G][#♯♭b]?\s*(?:major|minor))/i);
      if (keyPattern1) key = keyPattern1[1];

      // Pattern 2: Look in data attributes or JSON-LD
      const keyPattern2 = html.match(/"key"\s*:\s*"([^"]+)"/i);
      if (!key && keyPattern2) key = keyPattern2[1];

      // Pattern 3: Look for specific HTML structure
      const keyPattern3 = html.match(
        /<div[^>]*>\s*([A-G][#♯♭b]?\s*(?:major|minor))\s*<\/div>/i
      );
      if (!key && keyPattern3) key = keyPattern3[1];

      // Try multiple patterns to extract BPM
      const bpmPattern1 = html.match(/(\d{2,3})\s*(?:BPM|bpm)/);
      if (bpmPattern1) bpm = bpmPattern1[1];

      const bpmPattern2 = html.match(/"tempo"\s*:\s*(\d{2,3})/i);
      if (!bpm && bpmPattern2) bpm = bpmPattern2[1];

      if (!key) return null;

      // Normalize key format
      key = key.replace("♯", "#").replace("♭", "b").replace(/\s+/g, " ").trim();
      key = key.replace(/major/i, "Major").replace(/minor/i, "Minor");

      return { key, bpm };
    } catch (error) {
      console.error(`      Exception: ${error.message}`);
      return null;
    }
  }

  /**
   * Get basic music data (no scraping); retained for backward compatibility with callers.
   * Real key/BPM is sourced from SoundNet API in the main flow.
   */
  async getScrapedMusicData(_artist, _song, _useCache = true) {
    try {
      return {
        key: "Unknown",
        bpm: "Unknown",
        source: "Basic Data Service",
        scraping_success: false,
        note: "Compatibility analysis now handled by ChatGPT AI",
        data_quality: "basic",
      };
    } catch (error) {
      console.error("Error getting basic music data:", error);
      return {
        key: "Unknown",
        bpm: "Unknown",
        source: "Error",
        scraping_success: false,
        error: error.message,
        data_quality: "failed",
      };
    }
  }

  /**
   * Heuristics: filter out obvious non-songs
   */
  isDefinitelyNotASong(text) {
    const definitelyNotSongs = [
      /^(home|about|contact|search|menu|login|sign in|back|next|previous)$/i,
      /^(the|and|or|in|on|at|to|for|of|with|by|from)$/i,
      /https?:|www\.|\.com|\.html|javascript/i,
      /copyright|all rights|privacy policy|terms of|cookie/i,
      /^\d+$/,
      /^.{1}$/,
      /^(top|best|greatest|most popular|listen|spotify|youtube|album|playlist)$/i,
      /^\d{4}$|^\d{1,2}\/\d{1,2}/,
    ];
    return definitelyNotSongs.some((pattern) => pattern.test(text));
  }

  /**
   * Confidence calculation for extracted songs
   */
  calculateConfidence(text, songTitle, artistName, musicalKey, link) {
    let score = 50; // Base score

    const lowerText = text.toLowerCase();
    const lowerTitle = songTitle.toLowerCase();
    const lowerArtist = artistName.toLowerCase();
    const lowerKey = musicalKey.toLowerCase();

    if (lowerText.includes(lowerArtist)) score += 25; // Artist mentioned
    if (lowerText.includes(lowerKey)) score += 15; // Key mentioned

    // Artist & key proximity
    const artistKeyDistance = this.textDistance(
      lowerText,
      lowerArtist,
      lowerKey
    );
    if (artistKeyDistance < 50) score += 20;

    // Trust music-related domains
    const musicDomains = [
      "tunebat",
      "songbpm",
      "hooktheory",
      "musicnotes",
      "wikipedia",
      "discogs",
      "allmusic",
    ];
    if (link && musicDomains.some((domain) => link.includes(domain)))
      score += 25;

    // Title characteristics
    if (/^[A-Z]/.test(songTitle)) score += 10;
    if (songTitle.split(" ").length >= 2 && songTitle.split(" ").length <= 5)
      score += 10;
    if (lowerTitle.includes("feat") || lowerTitle.includes("ft")) score += 5;

    // Penalize very short/long titles
    if (songTitle.length < 3) score -= 30;
    if (songTitle.length > 40) score -= 15;

    // Nearby music keywords
    const musicKeywords = [
      "song",
      "track",
      "single",
      "hit",
      "music",
      "album",
      "released",
    ];
    const nearbyText = this.extractNearbyText(text, songTitle, 100);
    if (
      musicKeywords.some((keyword) =>
        nearbyText.toLowerCase().includes(keyword)
      )
    ) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Utility: distance between terms in text
   */
  textDistance(text, term1, term2) {
    const index1 = text.indexOf(term1);
    const index2 = text.indexOf(term2);
    if (index1 === -1 || index2 === -1) return Infinity;
    return Math.abs(index1 - index2);
  }

  /**
   * Utility: extract text near a phrase
   */
  extractNearbyText(text, phrase, charRadius = 100) {
    const index = text.toLowerCase().indexOf(phrase.toLowerCase());
    if (index === -1) return "";
    const start = Math.max(0, index - charRadius);
    const end = Math.min(text.length, index + phrase.length + charRadius);
    return text.substring(start, end);
  }

  /**
   * Clean up extracted song titles
   */
  cleanSongTitle(title, artistName) {
    return title
      .replace(new RegExp(artistName, "gi"), "")
      .replace(/\b(songs?|tracks?|music|album|key|major|minor)\b/gi, "")
      .replace(/[^\w\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Noise detection
   */
  isNoiseText(text) {
    const noisePatterns = [
      /^\d+$/,
      /^(the|and|or|in|on|at|to|for|of|with|by)$/i,
      /https?:\/\//,
      /(copyright|all rights|terms|privacy|about us)/i,
      /^[^a-zA-Z]*$/,
    ];
    return noisePatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Simplified multi-source aggregation (placeholder)
   */
  async scrapeMultipleSources(_artist, _song) {
    return {
      key: "Unknown",
      bpm: "Unknown",
      source: "Simplified Service",
      attempted_sources: ["Basic lookup"],
      scraping_success: false,
      note: "Use SoundNet API for actual key/BPM data",
    };
  }

  /**
   * Cleanup (no-op)
   */
  async cleanup() {
    /* nothing to release in simplified mode */
  }

  /**
   * Migration metadata
   */
  getMigrationInfo() {
    return {
      status: "MIGRATED_TO_CHATGPT",
      old_approach: "Google web scraping",
      new_approach: "ChatGPT AI analysis",
      compatibility_service: "ChatGPTCompatibilityService",
      deprecated_methods: [],
      migration_date: "2024-01-XX",
      benefits: [
        "Much faster response times",
        "More intelligent suggestions",
        "Better reliability",
        "Music theory based analysis",
        "No browser overhead",
      ],
    };
  }
}

module.exports = MusicDataScraper;
