/**
 * Harmonic Compatibility Engine
 * Determines which songs are harmonically compatible based on musical theory
 */

class HarmonicCompatibilityEngine {
  constructor() {
    // Circle of Fifths mapping
    this.circleOfFifths = {
      C: 0,
      G: 1,
      D: 2,
      A: 3,
      E: 4,
      B: 5,
      "F#": 6,
      Gb: 6,
      "C#": 7,
      Db: 7,
      Ab: 8,
      Eb: 9,
      Bb: 10,
      F: 11,
      Am: 0,
      Em: 1,
      Bm: 2,
      "F#m": 3,
      "C#m": 4,
      "G#m": 5,
      "D#m": 6,
      Ebm: 6,
      "A#m": 7,
      Bbm: 7,
      Fm: 8,
      Cm: 9,
      Gm: 10,
      Dm: 11,
    };
  }

  /**
   * Parse key string into components
   */
  parseKey(keyString) {
    if (!keyString || keyString === "Unknown") {
      return { key: null, mode: null, isValid: false };
    }

    // Normalize the key string
    const normalized = keyString.trim();

    // Match patterns like "C Major", "Am", "F# Minor", "Db", etc.
    const keyPattern = /^([A-G][#b]?)\s*(major|minor|maj|min|m)?$/i;
    const match = normalized.match(keyPattern);

    if (!match) {
      return { key: null, mode: null, isValid: false };
    }

    let [, note, mode] = match;

    // Normalize mode
    if (!mode) {
      // If no mode specified, assume major unless note ends with 'm'
      mode = note.endsWith("m") ? "minor" : "major";
      if (note.endsWith("m")) {
        note = note.slice(0, -1);
      }
    }

    mode = mode.toLowerCase();
    if (mode === "maj") mode = "major";
    if (mode === "min" || mode === "m") mode = "minor";

    // Create the normalized key
    const normalizedKey = mode === "minor" ? `${note}m` : note;

    return {
      key: normalizedKey,
      note,
      mode,
      isValid: true,
      circlePosition: this.circleOfFifths[normalizedKey],
    };
  }

  /**
   * Calculate harmonic compatibility between two keys
   */
  calculateKeyCompatibility(key1, key2) {
    const parsed1 = this.parseKey(key1);
    const parsed2 = this.parseKey(key2);

    if (!parsed1.isValid || !parsed2.isValid) {
      return { compatibility: "unknown", score: 0, reason: "Invalid key data" };
    }

    if (parsed1.key === parsed2.key) {
      return { compatibility: "perfect", score: 100, reason: "Same key" };
    }

    // Check relative major/minor relationship
    if (this.areRelativeKeys(parsed1, parsed2)) {
      return {
        compatibility: "excellent",
        score: 95,
        reason: "Relative major/minor keys",
      };
    }

    // Check parallel major/minor relationship
    if (this.areParallelKeys(parsed1, parsed2)) {
      return {
        compatibility: "very-good",
        score: 85,
        reason: "Parallel major/minor keys",
      };
    }

    // Check circle of fifths distance
    if (
      parsed1.circlePosition !== undefined &&
      parsed2.circlePosition !== undefined
    ) {
      const distance = this.calculateCircleDistance(
        parsed1.circlePosition,
        parsed2.circlePosition
      );

      if (distance === 1) {
        return {
          compatibility: "good",
          score: 80,
          reason: "Adjacent keys in circle of fifths",
        };
      } else if (distance === 2) {
        return {
          compatibility: "fair",
          score: 60,
          reason: "Two steps apart in circle of fifths",
        };
      } else if (distance === 3) {
        return {
          compatibility: "acceptable",
          score: 40,
          reason: "Three steps apart in circle of fifths",
        };
      }
    }

    return {
      compatibility: "poor",
      score: 20,
      reason: "Keys are not harmonically related",
    };
  }

  /**
   * Check if two keys are relative (share the same notes)
   */
  areRelativeKeys(parsed1, parsed2) {
    // C Major and A minor, G Major and E minor, etc.
    const relativePairs = [
      ["C", "Am"],
      ["G", "Em"],
      ["D", "Bm"],
      ["A", "F#m"],
      ["E", "C#m"],
      ["B", "G#m"],
      ["F#", "D#m"],
      ["Gb", "Ebm"],
      ["C#", "A#m"],
      ["Db", "Bbm"],
      ["Ab", "Fm"],
      ["Eb", "Cm"],
      ["Bb", "Gm"],
      ["F", "Dm"],
    ];

    return relativePairs.some(
      ([major, minor]) =>
        (parsed1.key === major && parsed2.key === minor) ||
        (parsed1.key === minor && parsed2.key === major)
    );
  }

  /**
   * Check if two keys are parallel (same root note, different modes)
   */
  areParallelKeys(parsed1, parsed2) {
    return parsed1.note === parsed2.note && parsed1.mode !== parsed2.mode;
  }

  /**
   * Calculate distance in circle of fifths
   */
  calculateCircleDistance(pos1, pos2) {
    const distance = Math.abs(pos1 - pos2);
    return Math.min(distance, 12 - distance); // Account for circular nature
  }

  /**
   * Calculate BPM compatibility
   */
  calculateBpmCompatibility(bpm1, bpm2) {
    const num1 = parseInt(bpm1);
    const num2 = parseInt(bpm2);

    if (isNaN(num1) || isNaN(num2)) {
      return { compatibility: "unknown", score: 0, reason: "Invalid BPM data" };
    }

    const difference = Math.abs(num1 - num2);

    if (difference === 0) {
      return {
        compatibility: "perfect",
        score: 100,
        reason: "Exact BPM match",
      };
    }

    // Check for half/double relationships
    const ratio1 = num1 / num2;
    const ratio2 = num2 / num1;

    if (Math.abs(ratio1 - 2) < 0.1 || Math.abs(ratio2 - 2) < 0.1) {
      return {
        compatibility: "excellent",
        score: 90,
        reason: "Half/double BPM relationship",
      };
    }

    if (Math.abs(ratio1 - 1.5) < 0.1 || Math.abs(ratio2 - 1.5) < 0.1) {
      return {
        compatibility: "good",
        score: 75,
        reason: "3/2 BPM relationship",
      };
    }

    // Linear BPM differences
    if (difference <= 5) {
      return {
        compatibility: "excellent",
        score: 95,
        reason: `Within 5 BPM (${difference} BPM difference)`,
      };
    } else if (difference <= 10) {
      return {
        compatibility: "good",
        score: 80,
        reason: `Within 10 BPM (${difference} BPM difference)`,
      };
    } else if (difference <= 20) {
      return {
        compatibility: "fair",
        score: 60,
        reason: `Within 20 BPM (${difference} BPM difference)`,
      };
    } else if (difference <= 40) {
      return {
        compatibility: "acceptable",
        score: 40,
        reason: `${difference} BPM difference`,
      };
    }

    return {
      compatibility: "poor",
      score: 20,
      reason: `Large BPM difference (${difference} BPM)`,
    };
  }

  /**
   * Calculate overall compatibility score
   */
  calculateOverallCompatibility(track1, track2) {
    const keyCompatibility = this.calculateKeyCompatibility(
      track1.key,
      track2.key
    );
    const bpmCompatibility = this.calculateBpmCompatibility(
      track1.bpm,
      track2.bpm
    );

    // Weight key compatibility more heavily than BPM (60/40 split)
    const overallScore =
      keyCompatibility.score * 0.6 + bpmCompatibility.score * 0.4;

    let overallCompatibility = "poor";
    if (overallScore >= 90) overallCompatibility = "excellent";
    else if (overallScore >= 75) overallCompatibility = "very-good";
    else if (overallScore >= 60) overallCompatibility = "good";
    else if (overallScore >= 40) overallCompatibility = "fair";
    else if (overallScore >= 25) overallCompatibility = "acceptable";

    return {
      overall: {
        compatibility: overallCompatibility,
        score: Math.round(overallScore),
        description: this.getCompatibilityDescription(overallCompatibility),
      },
      key: keyCompatibility,
      bpm: bpmCompatibility,
      mixing_advice: this.getMixingAdvice(keyCompatibility, bpmCompatibility),
    };
  }

  /**
   * Get user-friendly compatibility description
   */
  getCompatibilityDescription(compatibility) {
    const descriptions = {
      excellent: "🎯 Perfect for mixing - seamless transition",
      "very-good": "✅ Great compatibility - smooth mixing",
      good: "👍 Good match - will mix well together",
      fair: "⚖️ Decent compatibility - requires some skill",
      acceptable: "⚠️ Challenging but possible to mix",
      poor: "❌ Difficult to mix harmonically",
    };

    return descriptions[compatibility] || "❓ Unknown compatibility";
  }

  /**
   * Get mixing advice based on compatibility analysis
   */
  getMixingAdvice(keyCompat, bpmCompat) {
    const advice = [];

    // Key-based advice
    if (keyCompat.score >= 80) {
      advice.push("🎹 Keys mix naturally - no pitch adjustment needed");
    } else if (keyCompat.score >= 60) {
      advice.push("🎹 Keys are related - consider key-lock or harmonic mixing");
    } else {
      advice.push("🎹 Use camelot wheel or key-lock for best results");
    }

    // BPM-based advice
    if (bpmCompat.score >= 90) {
      advice.push("🥁 BPMs are perfectly matched for mixing");
    } else if (bpmCompat.score >= 70) {
      advice.push("🥁 BPMs are close - minimal tempo adjustment needed");
    } else if (bpmCompat.reason.includes("double")) {
      advice.push("🥁 Half/double BPM - perfect for creative transitions");
    } else {
      advice.push("🥁 Use tempo sync or beatmatching for smooth transition");
    }

    return advice;
  }

  /**
   * Find harmonically compatible tracks from a list
   */
  findCompatibleTracks(referenceTrack, candidateTracks, minScore = 40) {
    const compatibleTracks = [];

    for (const track of candidateTracks) {
      const compatibility = this.calculateOverallCompatibility(
        {
          key: referenceTrack.key_info?.key,
          bpm: referenceTrack.key_info?.bpm,
        },
        { key: track.key_info?.key, bpm: track.key_info?.bpm }
      );

      if (compatibility.overall.score >= minScore) {
        compatibleTracks.push({ ...track, compatibility_info: compatibility });
      }
    }

    // Sort by compatibility score (descending)
    return compatibleTracks.sort(
      (a, b) =>
        b.compatibility_info.overall.score - a.compatibility_info.overall.score
    );
  }

  /**
   * Generate search suggestions based on a reference track
   */
  generateCompatibleSearchSuggestions(referenceKey, referenceBpm) {
    const parsed = this.parseKey(referenceKey);
    if (!parsed.isValid) return [];

    const suggestions = [];

    // Add relative major/minor
    Object.entries(this.circleOfFifths).forEach(([key, position]) => {
      if (position === parsed.circlePosition && key !== parsed.key) {
        suggestions.push({ key, reason: "Relative major/minor", score: 95 });
      }
    });

    // Add adjacent keys
    const adjacentPositions = [
      (parsed.circlePosition + 1) % 12,
      (parsed.circlePosition + 11) % 12,
    ];

    Object.entries(this.circleOfFifths).forEach(([key, position]) => {
      if (adjacentPositions.includes(position)) {
        suggestions.push({
          key,
          reason: "Adjacent in circle of fifths",
          score: 80,
        });
      }
    });

    return suggestions.slice(0, 10); // Limit suggestions
  }
}

module.exports = HarmonicCompatibilityEngine;
