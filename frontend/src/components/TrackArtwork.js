/**
 * TrackArtwork Component - Album Image Display
 * Handles album artwork with loading, error, and accessibility states.
 */

import React, { useState, useCallback } from "react";

const TrackArtwork = ({
  url: imageUrl,
  name: trackName,
  artistName,
  alt,
  className = "",
  onLoad,
  onError,
  ...otherProps
}) => {
  const [imageState, setImageState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState(null);

  const handleImageLoad = useCallback(
    (e) => {
      setImageState("loaded");
      setErrorMessage(null);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleImageError = useCallback(
    (e) => {
      setImageState("error");
      setErrorMessage("Failed to load album artwork");
      if (process.env.NODE_ENV === "development") {
        console.warn(`Album artwork failed to load: ${imageUrl}`);
      }
      onError?.(e);
    },
    [imageUrl, onError]
  );

  const generateAltText = () => {
    if (alt) return alt;
    if (trackName && artistName)
      return `Album artwork for "${trackName}" by ${artistName}`;
    if (trackName) return `Album artwork for "${trackName}"`;
    if (artistName) return `Album artwork by ${artistName}`;
    return "Album artwork";
  };

  const imageClasses = ["track-artwork-image", `state-${imageState}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="track-artwork-container"
      data-state={imageState}
      aria-busy={imageState === "loading"}
    >
      {imageState === "loading" && (
        <div
          className="artwork-loading-placeholder"
          role="status"
          aria-label="Loading album artwork"
        >
          <div className="loading-spinner"></div>
        </div>
      )}

      <img
        src={imageUrl}
        alt={generateAltText()}
        className={imageClasses}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
        decoding="async"
        {...otherProps}
      />

      {imageState === "error" && (
        <div
          className="artwork-error-placeholder"
          role="img"
          aria-label="Album artwork unavailable"
        >
          <img
            src="/assets/fallback-art.png"
            alt="Fallback album cover"
            className="artwork-fallback"
          />
          <span className="error-text">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

TrackArtwork.displayName = "TrackArtwork";
export default TrackArtwork;
