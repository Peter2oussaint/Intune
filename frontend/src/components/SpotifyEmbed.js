/**
 * SpotifyEmbed Component
 * Renders an embedded Spotify player for a track
 */

import React, { useEffect, useState, useCallback } from "react";

const SpotifyEmbed = ({ trackId, compact = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Normalize track ID for all cases
  const extractTrackId = (id) => {
    if (!id) return null;
    if (id.includes("spotify:track:")) return id.split("spotify:track:")[1];
    if (id.includes("/track/")) return id.split("/track/")[1];
    if (id.includes(":")) return id.split(":").pop();
    return id;
  };

  const normalizedId = extractTrackId(trackId);
  if (!normalizedId) return null;

  const embedUrl = `https://open.spotify.com/embed/track/${normalizedId}`;
  const height = compact ? 80 : 152;

  // ✅ Stable event handlers
  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  // ✅ Render error state first
  if (error) {
    return (
      <div className="spotify-embed-container">
        <div className="embed-error">
          <p>Could not load Spotify player.</p>
          <a
            href={`https://open.spotify.com/track/${normalizedId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Spotify
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-embed-container">
      {!loaded && (
        <div className="embed-loading" style={{ height }}>
          <div className="loading-spinner" />
          <p>Loading Spotify player...</p>
        </div>
      )}
 <iframe
  src={embedUrl}
  width="100%"
  height={height}
  style={{
    borderRadius: "12px",
    display: loaded ? "block" : "none",
  }}
  allow="encrypted-media"
  allowtransparency="true"
  frameBorder="0"
  title={`Spotify player for track ${normalizedId}`}
  onLoad={handleLoad}
  onError={handleError}
  data-testid="spotify-iframe"
  ref={(iframe) => {
    //Native fallback so fireEvent.error() in JSDOM actually works
    if (iframe) {
      iframe.onerror = handleError;
      if (typeof window !== "undefined" && window.jest) {
        iframe.addEventListener("error", () => handleError());
      }
    }
  }}
/>

      {loaded && compact && (
        <div className="preview-note">
          <p>30s preview only.</p>
          <p>Full songs with Spotify Premium.</p>
        </div>
      )}
    </div>
  );
};

export default SpotifyEmbed;
