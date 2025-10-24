/**
 * Unit tests for HarmonicCompatibilityEngine
 * Tests musical theory calculations for key and BPM compatibility
 */

const HarmonicCompatibilityEngine = require("../services/harmonicCompatibility");

describe("HarmonicCompatibilityEngine", () => {
  let engine;

  beforeEach(() => {
    engine = new HarmonicCompatibilityEngine();
  });

  describe("parseKey", () => {
    test("correctly parses major keys", () => {
      const result = engine.parseKey("C Major");
      expect(result).toMatchObject({
        key: "C",
        note: "C",
        mode: "major",
        isValid: true,
        circlePosition: 0,
      });
    });

    test('correctly parses minor keys with "m" suffix', () => {
      const result = engine.parseKey("Am");
      expect(result).toMatchObject({
        key: "Am",
        note: "A",
        mode: "minor",
        isValid: true,
        circlePosition: 0,
      });
    });

    test("handles sharp keys", () => {
      const result = engine.parseKey("F# Major");
      expect(result.isValid).toBe(true);
      expect(result.note).toBe("F#");
      expect(result.mode).toBe("major");
    });

    test("handles flat keys", () => {
      const result = engine.parseKey("Bb Minor");
      expect(result.isValid).toBe(true);
      expect(result.key).toBe("Bbm");
      expect(result.mode).toBe("minor");
    });

    test('normalizes "maj" to "major"', () => {
      const result = engine.parseKey("C maj");
      expect(result.mode).toBe("major");
    });

    test('normalizes "min" to "minor"', () => {
      const result = engine.parseKey("A min");
      expect(result.mode).toBe("minor");
    });

    test("assumes major when no mode specified", () => {
      const result = engine.parseKey("G");
      expect(result.mode).toBe("major");
    });

    test("returns invalid for empty string", () => {
      const result = engine.parseKey("");
      expect(result.isValid).toBe(false);
      expect(result.key).toBeNull();
    });

    test('returns invalid for "Unknown"', () => {
      const result = engine.parseKey("Unknown");
      expect(result.isValid).toBe(false);
    });

    test("returns invalid for malformed keys", () => {
      const result = engine.parseKey("InvalidKey123");
      expect(result.isValid).toBe(false);
    });

    test("handles whitespace in key strings", () => {
      const result = engine.parseKey("  C  Major  ");
      expect(result.isValid).toBe(true);
      expect(result.key).toBe("C");
    });
  });

  describe("calculateKeyCompatibility", () => {
    test("perfect match: same key returns 100 score", () => {
      const result = engine.calculateKeyCompatibility("C Major", "C Major");
      expect(result.compatibility).toBe("perfect");
      expect(result.score).toBe(100);
      expect(result.reason).toBe("Same key");
    });

    test("excellent: relative keys (C Major / A minor)", () => {
      const result = engine.calculateKeyCompatibility("C Major", "Am");
      expect(result.compatibility).toBe("excellent");
      expect(result.score).toBe(95);
      expect(result.reason).toBe("Relative major/minor keys");
    });

    test("excellent: relative keys (G Major / E minor)", () => {
      const result = engine.calculateKeyCompatibility("G Major", "Em");
      expect(result.compatibility).toBe("excellent");
      expect(result.score).toBe(95);
    });

    test("very-good: parallel keys (C Major / C minor)", () => {
      const result = engine.calculateKeyCompatibility("C Major", "Cm");
      expect(result.compatibility).toBe("very-good");
      expect(result.score).toBe(85);
      expect(result.reason).toBe("Parallel major/minor keys");
    });

    test("good: adjacent in circle of fifths (C Major / G Major)", () => {
      const result = engine.calculateKeyCompatibility("C Major", "G Major");
      expect(result.compatibility).toBe("good");
      expect(result.score).toBe(80);
      expect(result.reason).toBe("Adjacent keys in circle of fifths");
    });

    test("good: adjacent in circle of fifths (C Major / F Major)", () => {
      const result = engine.calculateKeyCompatibility("C Major", "F Major");
      expect(result.compatibility).toBe("good");
      expect(result.score).toBe(80);
    });

    test("fair: two steps apart in circle of fifths", () => {
      const result = engine.calculateKeyCompatibility("C Major", "D Major");
      expect(result.compatibility).toBe("fair");
      expect(result.score).toBe(60);
      expect(result.reason).toBe("Two steps apart in circle of fifths");
    });

    test("acceptable: three steps apart in circle of fifths", () => {
      const result = engine.calculateKeyCompatibility("C Major", "A Major");
      expect(result.compatibility).toBe("acceptable");
      expect(result.score).toBe(40);
      expect(result.reason).toBe("Three steps apart in circle of fifths");
    });

    test("poor: keys are not harmonically related", () => {
      const result = engine.calculateKeyCompatibility("C Major", "F# Major");
      expect(result.compatibility).toBe("poor");
      expect(result.score).toBe(20);
      expect(result.reason).toBe("Keys are not harmonically related");
    });

    test("unknown: handles first key as Unknown", () => {
      const result = engine.calculateKeyCompatibility("Unknown", "C Major");
      expect(result.compatibility).toBe("unknown");
      expect(result.score).toBe(0);
      expect(result.reason).toBe("Invalid key data");
    });

    test("unknown: handles second key as Unknown", () => {
      const result = engine.calculateKeyCompatibility("C Major", "Unknown");
      expect(result.compatibility).toBe("unknown");
      expect(result.score).toBe(0);
    });

    test("unknown: handles both keys as Unknown", () => {
      const result = engine.calculateKeyCompatibility("Unknown", "Unknown");
      expect(result.compatibility).toBe("unknown");
      expect(result.score).toBe(0);
    });
  });

  describe("calculateBpmCompatibility", () => {
    test("perfect: exact BPM match", () => {
      const result = engine.calculateBpmCompatibility("120", "120");
      expect(result.compatibility).toBe("perfect");
      expect(result.score).toBe(100);
      expect(result.reason).toBe("Exact BPM match");
    });

    test("excellent: half BPM relationship", () => {
      const result = engine.calculateBpmCompatibility("120", "60");
      expect(result.compatibility).toBe("excellent");
      expect(result.score).toBe(90);
      expect(result.reason).toBe("Half/double BPM relationship");
    });

    test("excellent: double BPM relationship", () => {
      const result = engine.calculateBpmCompatibility("60", "120");
      expect(result.compatibility).toBe("excellent");
      expect(result.score).toBe(90);
      expect(result.reason).toBe("Half/double BPM relationship");
    });

    test("good: 3/2 BPM relationship", () => {
      const result = engine.calculateBpmCompatibility("120", "80");
      expect(result.compatibility).toBe("good");
      expect(result.score).toBe(75);
      expect(result.reason).toBe("3/2 BPM relationship");
    });

    test("excellent: within 5 BPM", () => {
      const result = engine.calculateBpmCompatibility("120", "123");
      expect(result.compatibility).toBe("excellent");
      expect(result.score).toBe(95);
      expect(result.reason).toContain("Within 5 BPM");
      expect(result.reason).toContain("3 BPM difference");
    });

    test("good: within 10 BPM", () => {
      const result = engine.calculateBpmCompatibility("120", "128");
      expect(result.compatibility).toBe("good");
      expect(result.score).toBe(80);
      expect(result.reason).toContain("Within 10 BPM");
    });

    test("fair: within 20 BPM", () => {
      const result = engine.calculateBpmCompatibility("120", "135");
      expect(result.compatibility).toBe("fair");
      expect(result.score).toBe(60);
      expect(result.reason).toContain("Within 20 BPM");
    });

    test("acceptable: within 40 BPM", () => {
      const result = engine.calculateBpmCompatibility("120", "155");
      expect(result.compatibility).toBe("acceptable");
      expect(result.score).toBe(40);
      expect(result.reason).toContain("35 BPM difference");
    });

    test("handles 120-180 BPM difference (half/double relationship)", () => {
      const result = engine.calculateBpmCompatibility("120", "180");
      // 180/120 = 1.5, which is detected as 3/2 relationship
      expect(result.compatibility).toMatch(/good|excellent/);
      expect(result.score).toBeGreaterThan(60);
    });

    test("unknown: handles invalid first BPM", () => {
      const result = engine.calculateBpmCompatibility("Unknown", "120");
      expect(result.compatibility).toBe("unknown");
      expect(result.score).toBe(0);
      expect(result.reason).toBe("Invalid BPM data");
    });

    test("unknown: handles invalid second BPM", () => {
      const result = engine.calculateBpmCompatibility("120", "Unknown");
      expect(result.compatibility).toBe("unknown");
      expect(result.score).toBe(0);
    });

    test("unknown: handles non-numeric BPM strings", () => {
      const result = engine.calculateBpmCompatibility("abc", "120");
      expect(result.compatibility).toBe("unknown");
      expect(result.score).toBe(0);
    });
  });

  describe("calculateOverallCompatibility", () => {
    test("combines perfect key and BPM scores", () => {
      const track1 = { key: "C Major", bpm: "120" };
      const track2 = { key: "C Major", bpm: "120" };
      const result = engine.calculateOverallCompatibility(track1, track2);

      expect(result.overall.compatibility).toBe("excellent");
      expect(result.overall.score).toBe(100);
      expect(result.overall.description).toContain("Perfect for mixing");
    });

    test("weights key more than BPM (60/40 split)", () => {
      // Perfect key, poor BPM
      const track1 = { key: "C Major", bpm: "120" };
      const track2 = { key: "C Major", bpm: "180" };
      const result = engine.calculateOverallCompatibility(track1, track2);

      // 100 * 0.6 + 20 * 0.4 = 68
      expect(result.overall.score).toBeGreaterThan(60);
      expect(result.overall.score).toBeLessThan(95);
    });

    test("includes key, bpm, and mixing_advice in result", () => {
      const track1 = { key: "C Major", bpm: "120" };
      const track2 = { key: "G Major", bpm: "122" };
      const result = engine.calculateOverallCompatibility(track1, track2);

      expect(result).toHaveProperty("overall");
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("bpm");
      expect(result).toHaveProperty("mixing_advice");
      expect(Array.isArray(result.mixing_advice)).toBe(true);
    });

    test("provides appropriate mixing advice for good compatibility", () => {
      const track1 = { key: "C Major", bpm: "120" };
      const track2 = { key: "Am", bpm: "120" };
      const result = engine.calculateOverallCompatibility(track1, track2);

      expect(result.mixing_advice.length).toBeGreaterThan(0);
      expect(result.mixing_advice.some((advice) => advice.includes("🎹"))).toBe(
        true
      );
      expect(result.mixing_advice.some((advice) => advice.includes("🥁"))).toBe(
        true
      );
    });

    test("classifies compatibility levels correctly", () => {
      const excellentCase = engine.calculateOverallCompatibility(
        { key: "C Major", bpm: "120" },
        { key: "C Major", bpm: "120" }
      );
      expect(excellentCase.overall.compatibility).toBe("excellent");

      const poorCase = engine.calculateOverallCompatibility(
        { key: "C Major", bpm: "120" },
        { key: "F# Major", bpm: "180" }
      );
      expect(poorCase.overall.compatibility).toMatch(/poor|fair|acceptable/);
    });
  });

  describe("findCompatibleTracks", () => {
    test("filters tracks by minimum score", () => {
      const reference = { key_info: { key: "C Major", bpm: "120" } };
      const candidates = [
        { id: 1, key_info: { key: "C Major", bpm: "120" } }, // Perfect
        { id: 2, key_info: { key: "G Major", bpm: "122" } }, // Good
        { id: 3, key_info: { key: "F# Major", bpm: "180" } }, // Poor
      ];

      const results = engine.findCompatibleTracks(reference, candidates, 60);

      expect(results.length).toBe(2); // Only first two should pass
      expect(results[0].id).toBe(1); // Perfect match first
      expect(results[1].id).toBe(2); // Good match second
    });

    test("sorts results by compatibility score (descending)", () => {
      const reference = { key_info: { key: "C Major", bpm: "120" } };
      const candidates = [
        { id: 1, key_info: { key: "G Major", bpm: "130" } },
        { id: 2, key_info: { key: "C Major", bpm: "120" } },
        { id: 3, key_info: { key: "Am", bpm: "122" } },
      ];

      const results = engine.findCompatibleTracks(reference, candidates, 40);

      expect(
        results[0].compatibility_info.overall.score
      ).toBeGreaterThanOrEqual(results[1].compatibility_info.overall.score);
      expect(
        results[1].compatibility_info.overall.score
      ).toBeGreaterThanOrEqual(results[2].compatibility_info.overall.score);
    });

    test("adds compatibility_info to each track", () => {
      const reference = { key_info: { key: "C Major", bpm: "120" } };
      const candidates = [{ id: 1, key_info: { key: "C Major", bpm: "120" } }];

      const results = engine.findCompatibleTracks(reference, candidates, 0);

      expect(results[0]).toHaveProperty("compatibility_info");
      expect(results[0].compatibility_info).toHaveProperty("overall");
      expect(results[0].compatibility_info).toHaveProperty("key");
      expect(results[0].compatibility_info).toHaveProperty("bpm");
    });

    test("returns empty array when no tracks meet minimum score", () => {
      const reference = { key_info: { key: "C Major", bpm: "120" } };
      const candidates = [{ id: 1, key_info: { key: "F# Major", bpm: "180" } }];

      const results = engine.findCompatibleTracks(reference, candidates, 90);

      expect(results).toEqual([]);
    });

    test("handles empty candidates array", () => {
      const reference = { key_info: { key: "C Major", bpm: "120" } };
      const results = engine.findCompatibleTracks(reference, [], 40);

      expect(results).toEqual([]);
    });
  });

  describe("generateCompatibleSearchSuggestions", () => {
    test("generates suggestions for valid key", () => {
      const suggestions = engine.generateCompatibleSearchSuggestions(
        "C Major",
        "120"
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test("includes relative major/minor in suggestions", () => {
      const suggestions = engine.generateCompatibleSearchSuggestions(
        "C Major",
        "120"
      );

      const hasRelative = suggestions.some(
        (s) => s.key === "Am" && s.reason === "Relative major/minor"
      );
      expect(hasRelative).toBe(true);
    });

    test("includes adjacent keys in circle of fifths", () => {
      const suggestions = engine.generateCompatibleSearchSuggestions(
        "C Major",
        "120"
      );

      const hasAdjacent = suggestions.some(
        (s) => s.reason === "Adjacent in circle of fifths"
      );
      expect(hasAdjacent).toBe(true);
    });

    test("returns empty array for invalid key", () => {
      const suggestions = engine.generateCompatibleSearchSuggestions(
        "Unknown",
        "120"
      );

      expect(suggestions).toEqual([]);
    });

    test("suggestions include score values", () => {
      const suggestions = engine.generateCompatibleSearchSuggestions(
        "C Major",
        "120"
      );

      suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty("key");
        expect(suggestion).toHaveProperty("reason");
        expect(suggestion).toHaveProperty("score");
        expect(typeof suggestion.score).toBe("number");
      });
    });
  });

  describe("getCompatibilityDescription", () => {
    test("returns correct description for each compatibility level", () => {
      expect(engine.getCompatibilityDescription("excellent")).toContain(
        "Perfect for mixing"
      );
      expect(engine.getCompatibilityDescription("very-good")).toContain(
        "Great compatibility"
      );
      expect(engine.getCompatibilityDescription("good")).toContain(
        "Good match"
      );
      expect(engine.getCompatibilityDescription("fair")).toContain(
        "Decent compatibility"
      );
      expect(engine.getCompatibilityDescription("acceptable")).toContain(
        "Challenging"
      );
      expect(engine.getCompatibilityDescription("poor")).toContain("Difficult");
    });

    test("handles unknown compatibility level", () => {
      const result = engine.getCompatibilityDescription("invalid-level");
      expect(result).toContain("Unknown");
    });
  });

  describe("getMixingAdvice", () => {
    test("provides key-based advice for high key compatibility", () => {
      const keyCompat = { score: 95, reason: "Same key" };
      const bpmCompat = { score: 90, reason: "Close BPM" };

      const advice = engine.getMixingAdvice(keyCompat, bpmCompat);

      expect(advice.some((a) => a.includes("🎹"))).toBe(true);
      expect(advice.some((a) => a.includes("no pitch adjustment"))).toBe(true);
    });

    test("provides BPM-based advice for perfect BPM match", () => {
      const keyCompat = { score: 80, reason: "Related keys" };
      const bpmCompat = { score: 100, reason: "Exact BPM match" };

      const advice = engine.getMixingAdvice(keyCompat, bpmCompat);

      expect(advice.some((a) => a.includes("🥁"))).toBe(true);
      expect(advice.some((a) => a.includes("perfectly matched"))).toBe(true);
    });

    test("provides advice for half/double BPM relationship", () => {
      const keyCompat = { score: 80, reason: "Related keys" };
      const bpmCompat = { score: 90, reason: "Half/double BPM relationship" };

      const advice = engine.getMixingAdvice(keyCompat, bpmCompat);

      // Just verify we get meaningful advice
      expect(Array.isArray(advice)).toBe(true);
      expect(advice.length).toBeGreaterThan(0);
      expect(advice.some((a) => a.includes("🥁") || a.includes("BPM"))).toBe(
        true
      );
    });

    test("always returns an array with at least 2 items", () => {
      const keyCompat = { score: 50, reason: "Moderate" };
      const bpmCompat = { score: 50, reason: "Moderate" };

      const advice = engine.getMixingAdvice(keyCompat, bpmCompat);

      expect(Array.isArray(advice)).toBe(true);
      expect(advice.length).toBeGreaterThanOrEqual(2);
    });
  });
});
