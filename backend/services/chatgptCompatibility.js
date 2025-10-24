/**
 * ChatGPT-powered Music Compatibility Service
 * Uses OpenAI's ChatGPT to find harmonically compatible tracks
 * Replaces the Google scraping approach with intelligent AI suggestions
 */

class ChatGPTCompatibilityService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = "https://api.openai.com/v1/chat/completions";
    this.model = process.env.CHATGPT_MODEL || "gpt-3.5-turbo"; // Use GPT-3.5-turbo as fallback
    this.requestCache = new Map(); // Cache to avoid duplicate requests
    // Validate API key on initialization (silent; handled at call sites)
  }

  async findCompatibleTracks(referenceTrack, limit = 10, retryCount = 0) {
    try {
      const { key, bpm, artist, song, year, genre } =
        this.extractTrackInfo(referenceTrack);

      // Simplified prompt focusing on key/bpm data only
      const prompt = `Find ${limit} songs that are musically compatible with "${song}" by "${artist}".

Reference: Key=${key}, bpm=${bpm}, Genre=${genre}

Return JSON with this exact format:
{
  "tracks": [
    {
      "artist": "Artist Name",
      "song": "Song Title", 
      "key": "Key",
      "bpm": "bpm"
    }
  ]
}

Requirements:
- Compatible keys (same key, relative major/minor, adjacent on circle of fifths)
- Similar bpm (±15 bpm or half/double)
- Real songs only
- Return ONLY JSON, no explanations.`;

      // Make the API request to ChatGPT
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": "Intune-Music-App/1.0",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: this.getSystemPrompt() },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      // Check for valid response
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No choices in API response");
      }

      // Parse the response to get the compatible tracks
      const compatibleTracks = this.parseCompatibilityResponse(
        data.choices[0].message.content
      );

      // Return the compatible tracks
      return compatibleTracks;
    } catch (error) {
      console.error("ChatGPT API Error:", error);

      // Retry once if it's the first attempt
      if (retryCount === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.findCompatibleTracks(referenceTrack, limit, 1);
      }

      // Use fallback tracks if the API fails
      return this.getFallbackTracks(referenceTrack, limit);
    }
  }

  /**
   * Extract relevant information from the reference track
   */
  extractTrackInfo(referenceTrack) {
    const key = referenceTrack.key_info?.key || "Unknown";
    const bpm =
      referenceTrack.key_info?.bpm || referenceTrack.key_info?.bpm || "Unknown";
    const artist =
      referenceTrack.artists?.[0]?.name ||
      referenceTrack.artist_name ||
      "Unknown Artist";
    const song =
      referenceTrack.name || referenceTrack.song_title || "Unknown Song";

    // Extract year from album release date
    let year = "Recent";
    if (referenceTrack.album?.release_date) {
      year = referenceTrack.album.release_date.substring(0, 4);
    }

    // Infer genre from audio features or use default
    const genre = this.inferGenreFromTrack(referenceTrack);

    return { key, bpm, artist, song, year, genre };
  }

  /**
   * Infer genre from track characteristics
   */
  inferGenreFromTrack(track) {
    // Basic genre inference based on bpm and other factors
    const bpm = parseInt(track.key_info?.bpm) || 120;

    if (bpm < 70) return "Ballad/Ambient";
    if (bpm < 90) return "Pop/Folk";
    if (bpm < 110) return "Pop/Rock";
    if (bpm < 130) return "Rock/Alternative";
    if (bpm < 150) return "Dance/Electronic";
    return "Electronic/EDM";
  }

  /**
   * System prompt for ChatGPT
   */
  getSystemPrompt() {
    return `You are an expert music curator and DJ with deep knowledge of:
- Music across all genres and eras
- Songs that work well together in playlists
- Popular and lesser-known tracks
- Artist relationships and musical similarities

You provide practical song recommendations for creating cohesive playlists. You only suggest real songs that actually exist and have been commercially released.

Your responses are always in valid JSON format as requested. You focus on songs that would realistically work well together in a playlist, considering factors like genre, era, energy level, and general musical compatibility.

Always return proper JSON with no additional text outside the JSON structure.`;
  }

  /**
   * Parse the ChatGPT response and structure it properly
   */
  parseCompatibilityResponse(responseText) {
    try {
      // Clean up the response text
      let cleanedResponse = responseText.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse
          .replace(/```json\n?/, "")
          .replace(/\n?```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse
          .replace(/```\n?/, "")
          .replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(cleanedResponse);

      // Handle multiple possible response formats
      let tracks = [];

      if (parsed.compatible_tracks && Array.isArray(parsed.compatible_tracks)) {
        tracks = parsed.compatible_tracks;
      } else if (
        parsed.recommended_tracks &&
        Array.isArray(parsed.recommended_tracks)
      ) {
        tracks = parsed.recommended_tracks;
      } else if (parsed.playlist && Array.isArray(parsed.playlist)) {
        // Handle the format that's actually being returned
        tracks = parsed.playlist.map((track) => ({
          artist: track.artist,
          song: track.title || track.song, // Handle both 'title' and 'song' fields
          estimated_key: track.key || track.estimated_key || "Unknown",
          estimated_bpm: track.bpm || track.estimated_bpm || "Unknown",
          compatibility_reason:
            track.compatibility_reason || "Compatible with reference track",
          compatibility_score: track.compatibility_score || 80,
        }));
      } else if (parsed.tracks && Array.isArray(parsed.tracks)) {
        tracks = parsed.tracks;
      } else if (Array.isArray(parsed)) {
        // Handle direct array response
        tracks = parsed;
      }

      if (tracks.length === 0) {
        console.error("❌ No tracks found in any expected format");
        return [];
      }

      // Map tracks to consistent format
      return tracks.map((track, index) => ({
        artist: track.artist || "Unknown Artist",
        song: track.song || track.title || track.name || "Unknown Song",
        estimated_key: track.estimated_key || track.key || "Unknown",
        estimated_bpm:
          track.estimated_bpm || track.bpm || track.estimated_bpm || "Unknown",
        compatibility_reason:
          track.compatibility_reason || "Compatible with reference track",
        compatibility_score: track.compatibility_score || 85 - index, // Declining scores
        source: "ChatGPT Music Analysis",
        ai_generated: true,
      }));
    } catch (error) {
      console.error("❌ Error parsing ChatGPT response:", error);
      // Try to extract songs manually if JSON parsing fails
      return this.fallbackTextParsing(responseText);
    }
  }

  /**
   *  Enhanced fallback text parsing that won't confuse field names with songs
   */
  fallbackTextParsing(responseText) {
    try {
      const lines = responseText.split("\n");
      const tracks = [];

      // More specific patterns that are less likely to match JSON field names
      const safePatterns = [
        // "Song Title" by Artist Name
        /^[\d.\-\s]*["']([^"']{3,50})["']\s+by\s+([A-Z][a-zA-Z\s&'.]{2,40})$/i,
        // Artist Name - "Song Title"
        /^[\d.\-\s]*([A-Z][a-zA-Z\s&'.]{2,40})\s*[-–]\s*["']([^"']{3,50})["']$/,
        // 1. Artist Name - Song Title (without quotes but with number)
        /^\s*\d+\.\s*([A-Z][a-zA-Z\s&'.]{2,40})\s*[-–]\s*([A-Z][a-zA-Z\s'.,!?]{3,50})$/,
        // • Artist Name - Song Title (bullet points)
        /^[\s•\-\*]+([A-Z][a-zA-Z\s&'.]{2,40})\s*[-–]\s*([A-Z][a-zA-Z\s'.,!?]{3,50})$/,
      ];

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip lines that look like JSON or contain field names
        if (
          trimmedLine.includes("{") ||
          trimmedLine.includes("}") ||
          trimmedLine.includes("compatibility_score") ||
          trimmedLine.includes("estimated_") ||
          trimmedLine.includes('"artist"') ||
          trimmedLine.includes('"song"') ||
          trimmedLine.includes("compatibility_reason") ||
          trimmedLine.match(/^\s*\d+[,\s]*$/)
        ) {
          continue;
        }

        for (const pattern of safePatterns) {
          const match = trimmedLine.match(pattern);
          if (match) {
            let artist, song;

            // Determine which capture group is artist vs song based on pattern
            if (pattern.source.includes("by\\s+")) {
              // "Song" by Artist pattern
              song = match[1].trim();
              artist = match[2].trim();
            } else {
              // Artist - Song pattern (most common)
              artist = match[1].trim();
              song = match[2].trim();
            }

            // Additional validation to avoid JSON field names
            if (this.isValidArtistSongPair(artist, song)) {
              tracks.push({
                artist: artist,
                song: song,
                estimated_key: "Unknown",
                estimated_bpm: "Unknown",
                compatibility_reason: "Text-parsed recommendation",
                compatibility_score: Math.max(85 - tracks.length * 2, 60),
                source: "ChatGPT Safe Text Parsing",
                ai_generated: true,
              });
            }

            break; // Found a match for this line, move to next line
          }
        }

        if (tracks.length >= 15) break; // Limit fallback results
      }

      return tracks;
    } catch (fallbackError) {
      console.error("❌ Safe fallback parsing failed:", fallbackError);
      return [];
    }
  }

  /**
   * Validate that we have a real artist/song pair and not JSON field names
   */
  isValidArtistSongPair(artist, song) {
    // List of common JSON field names and values to reject
    const invalidTerms = [
      "compatibility_score",
      "estimated_key",
      "estimated_bpm",
      "estimated_bpm",
      "compatibility_reason",
      "artist",
      "song",
      "title",
      "key",
      "bpm",
      "bpm",
      "major",
      "minor",
      "unknown",
    ];

    const artistLower = artist.toLowerCase();
    const songLower = song.toLowerCase();

    // Reject if either contains invalid terms
    for (const term of invalidTerms) {
      if (artistLower.includes(term) || songLower.includes(term)) {
        return false;
      }
    }

    // Reject pure numbers
    if (/^\d+$/.test(artist) || /^\d+$/.test(song)) return false;

    // Require reasonable lengths
    if (
      artist.length < 2 ||
      song.length < 3 ||
      artist.length > 40 ||
      song.length > 60
    ) {
      return false;
    }

    return true;
  }

  /**
   * Enhanced fallback tracks with better variety
   */
  getFallbackTracks(referenceTrack, limit) {
    const artist =
      referenceTrack.artists?.[0]?.name ||
      referenceTrack.artist_name ||
      "Unknown";
    const song = referenceTrack.name || referenceTrack.song_title || "Unknown";

    // Genre-based fallback tracks
    const fallbackByGenre = {
      "Modest Mouse": [
        {
          artist: "The Strokes",
          song: "Last Nite",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Arcade Fire",
          song: "Wake Up",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Interpol",
          song: "Evil",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "The National",
          song: "Bloodbuzz Ohio",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Built to Spill",
          song: "Carry the Zero",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
      ],
      default: [
        {
          artist: "The Beatles",
          song: "Come Together",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Radiohead",
          song: "Creep",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Nirvana",
          song: "Smells Like Teen Spirit",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Pearl Jam",
          song: "Alive",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
        {
          artist: "Red Hot Chili Peppers",
          song: "Under the Bridge",
          estimated_key: "Unknown",
          estimated_bpm: "Unknown",
        },
      ],
    };

    const tracks = fallbackByGenre[artist] || fallbackByGenre["default"];

    return tracks.slice(0, limit).map((track, index) => ({
      ...track,
      compatibility_reason:
        "Fallback recommendation based on genre/artist similarity",
      compatibility_score: 70 - index,
      source: "Fallback Database",
      ai_generated: false,
    }));
  }

  /**
   * Test OpenAI API connection
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: "No API key configured",
          suggestion: "Add OPENAI_API_KEY to your .env file",
        };
      }

      const testPrompt =
        'Respond with just the word "test" in JSON format: {"response": "test"}';

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": "Intune-Music-App/1.0",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: testPrompt }],
          max_tokens: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "OpenAI API connection successful",
          model: this.model,
          response: data,
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          status: response.status,
          error: errorText,
          suggestion: this.getErrorSuggestion(response.status),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion: "Check your internet connection and API key",
      };
    }
  }

  /**
   * Get error suggestions based on status code
   */
  getErrorSuggestion(status) {
    switch (status) {
      case 401:
        return "Check your OPENAI_API_KEY in .env file";
      case 403:
        return "Check your OpenAI account billing and permissions";
      case 404:
        return 'The model might not be available. Try "gpt-4" or "gpt-3.5-turbo"';
      case 429:
        return "Rate limit exceeded. Wait a moment and try again";
      default:
        return "Check the OpenAI API documentation for this error code";
    }
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache() {
    this.requestCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cache_size: this.requestCache.size,
      cached_keys: Array.from(this.requestCache.keys()),
    };
  }
}

module.exports = ChatGPTCompatibilityService;
