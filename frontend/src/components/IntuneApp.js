import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../utils/supabaseClient";
import SpotifyEmbed from "./SpotifyEmbed";
import "./App.css";

import TrackArtwork from "./TrackArtwork";

import intuneLogoImage from "../assets/logo/INTUNE.LOGO.png";

const API_BASE_URL = process.env.INTUNE_API_URL || "http://localhost:4000";

// Constants for BPM ranges
const BPM_RANGES = {
  tight: { id: "tight", label: "±5 BPM", range: 5 },
  moderate: { id: "moderate", label: "±10 BPM", range: 10 },
  wide: { id: "wide", label: "±15 BPM", range: 15 },
  extended: { id: "extended", label: "±25 BPM", range: 25 },
  all: { id: "all", label: "All BPMs", range: null },
};

/**
 * UTILITY FUNCTIONS FOR DATA NORMALIZATION
 */
const extractKeyInfo = (track) => {
  let keyData = { key: "Unknown", bpm: "Unknown" };

  if (track?.key_info && typeof track.key_info === "object") {
    return {
      key: track.key_info.key || "Unknown",
      bpm: track.key_info.bpm || track.key_info.tempo || "Unknown",
    };
  }

  if (track?.key_info && typeof track.key_info === "string") {
    try {
      const parsed = JSON.parse(track.key_info);
      return {
        key: parsed.key || "Unknown",
        bpm: parsed.bpm || parsed.tempo || "Unknown",
      };
    } catch {
      // ignore parse failures; fall through to defaults
    }
  }

  if (
    track?.key ||
    track?.bpm ||
    track?.tempo ||
    track?.estimated_key ||
    track?.estimated_bpm
  ) {
    return {
      key: track.key || track.musical_key || track.estimated_key || "Unknown",
      bpm: track.bpm || track.tempo || track.estimated_bpm || "Unknown",
    };
  }

  if (track?.soundnet_data) {
    try {
      const soundnetData =
        typeof track.soundnet_data === "string"
          ? JSON.parse(track.soundnet_data)
          : track.soundnet_data;

      if (soundnetData?.key || soundnetData?.bpm) {
        return {
          key: soundnetData.key || "Unknown",
          bpm: soundnetData.bpm || soundnetData.tempo || "Unknown",
        };
      }
    } catch {
      // ignore parse failures
    }
  }

  return keyData;
};

const normalizeTrackData = (track) => {
  if (!track) return null;

  const keyInfo = extractKeyInfo(track);

  return {
    ...track,
    key_info: {
      key: keyInfo.key,
      bpm: keyInfo.bpm,
      source: track?.key_info?.source || track?.source || "Unknown",
    },
    artists: track.artists || [
      {
        name: track.artist || track.artist_name || "Unknown Artist",
      },
    ],
    name:
      track.name ||
      track.title ||
      track.song_title ||
      track.song ||
      "Unknown Song",
    id: track.id || track.song_id,
    album: track.album || {},
  };
};

const getTrackId = (track) => track.song_id || track.id;
const getTrackName = (track) => track.name || track.song_title;
const getTrackArtist = (track) => track.artists?.[0]?.name || track.artist_name;

/**
 * Shared button component for common button styling
 */
const StyledButton = ({
  onClick,
  disabled,
  className,
  children,
  title,
  type = "button",
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={className}
    title={title}
  aria-label={typeof children === "string" ? children : title}
  >
    {children}
  </button>
);

/**
 * TopHeader - Gradient header with welcome message and logout
 */
const TopHeader = ({ user, onLogout }) => (
  <div className="top-header">
    <div className="top-header-content">
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to Intune</h1>
        <p className="welcome-subtitle">
          Discover harmonically compatible music
        </p>
      </div>

      {user && (
        <div className="top-user-controls">
          <div className="user-info-top">
            <span className="user-greeting">
              Hello, {user.email?.split("@")[0]}!
            </span>
            <span className="user-email">{user.email}</span>
          </div>
          <StyledButton
            onClick={onLogout}
            className="logout-button-top"
            title="Sign out of your account"
          >
            Sign Out
          </StyledButton>
        </div>
      )}
    </div>
  </div>
);

/**
 * SearchInterface - Simple artist and song search
 */
const SearchInterface = ({
  artistQuery,
  songQuery,
  onArtistQueryChange,
  onSongQueryChange,
  onSearch,
  isSearching,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <section className="search-section">
      <div className="searchbox">
        <div className="logoWrapper">
          <img src={intuneLogoImage} />
        </div>

        <div className="search-inputs">
          <label htmlFor="artist-search">
            <span className="span">Artist</span>
            <input
              id="artist-search"
              type="text"
              placeholder="Enter artist name"
              value={artistQuery}
              onChange={(e) => onArtistQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
              aria-label="Enter artist name"
            />
          </label>

          <label htmlFor="song-search">
            <span className="span">Song</span>
            <input
              id="song-search"
              type="text"
              placeholder="Enter song name"
              value={songQuery}
              onChange={(e) => onSongQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
              aria-label="Enter song name"
            />
          </label>
        </div>

        <div className="search-controls">
          <StyledButton
            onClick={onSearch}
            disabled={isSearching || !artistQuery.trim() || !songQuery.trim()}
            className="search-button"
            title={
              isSearching
                ? "Searching..."
                : "Search for track and compatible music"
            }
          >
            {isSearching ? (
              <>
                <span className="button-spinner"></span>
                Searching...
              </>
            ) : (
              "Search"
            )}
          </StyledButton>
        </div>

        <div className="search-info"></div>
      </div>
    </section>
  );
};

/**
 * MainHeader - Logo and search functionality
 */
const MainHeader = ({
  artistQuery,
  songQuery,
  onArtistQueryChange,
  onSongQueryChange,
  onSearch,
  isSearching,
}) => (
  <header className="main-header">
    <SearchInterface
      artistQuery={artistQuery}
      songQuery={songQuery}
      onArtistQueryChange={onArtistQueryChange}
      onSongQueryChange={onSongQueryChange}
      onSearch={onSearch}
      isSearching={isSearching}
    />
  </header>
);

/**
 * BPM Filter Component
 */
const BPMFilterControls = ({
  referenceBPM,
  selectedRange,
  onRangeChange,
  compatibleTracks,
}) => {
  const ranges = Object.values(BPM_RANGES);

  const getFilteredCount = (range) => {
    if (!referenceBPM || referenceBPM === "Unknown" || referenceBPM === "-")
      return compatibleTracks.length;
    if (range === null) return compatibleTracks.length;

    const refBPM = parseInt(referenceBPM, 10);
    if (Number.isNaN(refBPM)) return compatibleTracks.length;

    return compatibleTracks.filter((track) => {
      const keyInfo = extractKeyInfo(track);
      const trackBPM = parseInt(keyInfo.bpm, 10);
      if (Number.isNaN(trackBPM)) return false;
      return Math.abs(trackBPM - refBPM) <= range;
    }).length;
  };

  if (!referenceBPM || referenceBPM === "Unknown" || referenceBPM === "-") {
    return (
      <div className="bpm-filter-controls">
        <p className="bpm-filter-note">
          BPM filtering available when reference track has BPM data
        </p>
      </div>
    );
  }

  return (
    <div className="bpm-filter-controls">
      <h3 className="filter-title">
        🎯 BPM Filter (Reference: {referenceBPM} BPM)
      </h3>
      <div className="bpm-range-buttons">
        {ranges.map((range) => (
          <StyledButton
            key={range.id}
            onClick={() => onRangeChange(range.id)}
            className={`bpm-range-btn ${
              selectedRange === range.id ? "active" : ""
            }`}
            title={`Show tracks within ${range.label} of ${referenceBPM} BPM`}
          >
            {range.label}
            <span className="track-count">
              ({getFilteredCount(range.range)})
            </span>
          </StyledButton>
        ))}
      </div>
    </div>
  );
};

/**
 * Track row component for reuse in both lists
 */
const TrackRow = ({
  track,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  isAddingToPlaylist,
  isRemovingFromPlaylist,
  isInPlaylist,
  showRemove = false,
  trackRowId = null,
  showEmbed = false, // NEW PROP
}) => {
  const [embedVisible, setEmbedVisible] = useState(false); // NEW STATE
  const trackId = getTrackId(track);
  const trackName = getTrackName(track);
  const artistName = getTrackArtist(track);
  const keyInfo = extractKeyInfo(track);
  const actionId = trackRowId || trackId;

  return (
    <div className="track-row-container">
      {" "}
      {/* CHANGED from just track-row */}
      <div className={`track-row ${embedVisible ? "expanded" : ""}`}>
        {" "}
        {/* ADDED expanded class */}
        <div className="track-cell artist" title={artistName}>
          {artistName}
        </div>
        <div className="track-cell song" title={trackName}>
          {trackName}
        </div>
        <div className="track-cell key">{keyInfo.key}</div>
        <div className="track-cell bpm">{keyInfo.bpm}</div>
        <div className="track-cell action">
          {showRemove ? (
            <StyledButton
              onClick={() => onRemoveFromPlaylist(actionId)}
              disabled={isRemovingFromPlaylist === actionId}
              className="remove-track-btn"
              title={`Remove "${trackName}" from playlist`}
            >
              {isRemovingFromPlaylist === actionId ? "..." : "×"}
            </StyledButton>
          ) : isInPlaylist ? (
            <span className="already-added">✓ Added</span>
          ) : (
            <StyledButton
              onClick={() => onAddToPlaylist(track)}
              disabled={isAddingToPlaylist === trackId}
              className="add-track-btn"
              title={`Add "${trackName}" to playlist`}
            >
              {isAddingToPlaylist === trackId ? "..." : "+"}
            </StyledButton>
          )}

          {/* NEW: Toggle button for Spotify embed */}
          {showEmbed && trackId && (
            <StyledButton
              onClick={() => setEmbedVisible(!embedVisible)}
              className="play-btn"
              title={embedVisible ? "Hide player" : "Show player"}
            >
              {embedVisible ? "▼" : "▶️"}
            </StyledButton>
          )}
        </div>
      </div>
      {/* NEW: Collapsible Spotify embed */}
      {showEmbed && embedVisible && trackId && (
        <div className="track-embed">
          <SpotifyEmbed trackId={trackId} compact={true} />
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced Compatible Tracks List with integrated BPM filtering in header
 */
const EnhancedCompatibleTracksList = ({
  tracks,
  referenceBPM,
  selectedBPMRange,
  onRangeChange,
  onAddToPlaylist,
  isAddingToPlaylist,
  playlist,
}) => {
  const [bpmSortAsc, setBpmSortAsc] = useState(true);

  const ranges = Object.values(BPM_RANGES);

  const byBpm = (t) => {
    const k = extractKeyInfo(t);
    const n = parseInt(k?.bpm, 10);
    return Number.isNaN(n)
      ? bpmSortAsc
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY
      : n;
  };

  const getFilteredCount = (range) => {
    if (!referenceBPM || referenceBPM === "Unknown" || referenceBPM === "-")
      return tracks.length;
    if (range === null) return tracks.length;

    const refBPM = parseInt(referenceBPM, 10);
    if (Number.isNaN(refBPM)) return tracks.length;

    return tracks.filter((track) => {
      const keyInfo = extractKeyInfo(track);
      const trackBPM = parseInt(keyInfo.bpm, 10);
      if (Number.isNaN(trackBPM)) return false;
      return Math.abs(trackBPM - refBPM) <= range;
    }).length;
  };

  const getFilteredTracks = () => {
    if (
      !referenceBPM ||
      referenceBPM === "Unknown" ||
      referenceBPM === "-" ||
      selectedBPMRange === "all"
    ) {
      return [...tracks].sort((a, b) =>
        bpmSortAsc ? byBpm(a) - byBpm(b) : byBpm(b) - byBpm(a)
      );
    }

    const range = BPM_RANGES[selectedBPMRange]?.range;
    if (!range) return tracks;

    const refBPM = parseInt(referenceBPM, 10);
    const filtered = tracks.filter((track) => {
      const k = extractKeyInfo(track);
      const trackBPM = parseInt(k?.bpm, 10);
      if (Number.isNaN(trackBPM)) return false;
      return Math.abs(trackBPM - refBPM) <= range;
    });

    return filtered.sort((a, b) =>
      bpmSortAsc ? byBpm(a) - byBpm(b) : byBpm(b) - byBpm(a)
    );
  };

  const filteredTracks = getFilteredTracks();

  const isTrackInPlaylist = (trackId) =>
    playlist.some((p) => getTrackId(p) === trackId);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="compatible-tracks-empty">
        <p>No compatible tracks found</p>
      </div>
    );
  }

  const hasBpmData =
    referenceBPM && referenceBPM !== "Unknown" && referenceBPM !== "-";

  return (
    <div className="compatible-tracks-list">
      {/* COMBINED HEADER WITH BPM FILTERS */}
      <div className="tracks-header-with-filters">
        <div className="tracks-header-main">
          <h2 className="list-header">
            Compatible Tracks ({filteredTracks.length} of {tracks.length})
          </h2>
        </div>

        {/* BPM FILTER BUTTONS WITH SORT ON SAME LINE */}
        {hasBpmData ? (
          <div className="bpm-filter-inline">
            <div className="bpm-range-buttons-inline">
              {ranges.map((range) => (
                <StyledButton
                  key={range.id}
                  onClick={() => onRangeChange(range.id)}
                  className={`bpm-range-btn-inline ${
                    selectedBPMRange === range.id ? "active" : ""
                  }`}
                  title={`Show tracks within ${range.label} of ${referenceBPM} BPM`}
                >
                  {range.label}
                  <span className="track-count-inline">
                    ({getFilteredCount(range.range)})
                  </span>
                </StyledButton>
              ))}

              {/* Sort button on same line, always visible */}
              <StyledButton
                onClick={() => setBpmSortAsc((v) => !v)}
                className="bpm-sort-toggle-inline"
                title={bpmSortAsc ? "Sorted low → high" : "Sorted high → low"}
              >
                Sort: {bpmSortAsc ? "↑" : "↓"} BPM
              </StyledButton>
            </div>
          </div>
        ) : (
          <p className="bpm-filter-note-inline">
            BPM filtering available when reference track has BPM data
          </p>
        )}
      </div>

      {filteredTracks.length === 0 ? (
        <div className="compatible-tracks-empty">
          <p>No tracks found in the selected BPM range</p>
          <p>Try expanding the BPM range or select "All BPMs"</p>
        </div>
      ) : (
        <>
          <div className="tracks-table-header">
            <div className="header-cell">Artist</div>
            <div className="header-cell">Song</div>
            <div className="header-cell">Key</div>
            <div className="header-cell">BPM</div>
            <div className="header-cell">Add</div>
          </div>

          <div className="tracks-table-body">
            {filteredTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                onAddToPlaylist={onAddToPlaylist}
                isAddingToPlaylist={isAddingToPlaylist}
                isInPlaylist={isTrackInPlaylist(track.id)}
                showEmbed={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * UserPlaylist - Display with fixed header z-index
 */
const UserPlaylist = ({
  playlist,
  onRemoveFromPlaylist,
  isRemovingFromPlaylist,
}) => {
  if (playlist.length === 0) {
    return (
      <div className="user-playlist empty-playlist">
        <h2 className="list-header">Your Playlist</h2>
        <div className="empty-playlist-message">
          <p>Your playlist is empty.</p>
          <p>Add songs from the compatible tracks list!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-playlist">
      <h2 className="list-header">
        Your Playlist ({playlist.length} track{playlist.length !== 1 ? "s" : ""}
        )
      </h2>
      <div className="tracks-table-header">
        <div className="header-cell">Artist</div>
        <div className="header-cell">Song</div>
        <div className="header-cell">Key</div>
        <div className="header-cell">BPM</div>
        <div className="header-cell">Delete</div>
      </div>
      <div className="tracks-table-body">
        {playlist.map((track) => (
          <TrackRow
            key={track.playlistRowId || track.id}
            track={track}
            onRemoveFromPlaylist={onRemoveFromPlaylist}
            isRemovingFromPlaylist={isRemovingFromPlaylist}
            showRemove
            trackRowId={track.playlistRowId}
            showEmbed={true} // ADD THIS
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Loading & Error
 */
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="loading-container" role="status" aria-live="polite">
    <div className="loading-spinner"></div>
    <p className="loading-message">{message}</p>
  </div>
);

const ErrorMessage = ({ error, onDismiss }) =>
  error ? (
    <div className="error-container" role="alert">
      <span className="error-icon">⚠️</span>
      <span className="error-message">{error}</span>
      {onDismiss && (
        <StyledButton
          onClick={onDismiss}
          className="error-dismiss"
          title="Dismiss error message"
        >
          ✕
        </StyledButton>
      )}
    </div>
  ) : null;

/**
 * Main Intune App Component
 */
const IntuneApp = () => {
  const navigate = useNavigate();

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticationLoading, setIsAuthenticationLoading] = useState(true);

  // Search State
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // BPM Filter State
  const [selectedBPMRange, setSelectedBPMRange] = useState("tight");

  // Playlist State
  const [userPlaylist, setUserPlaylist] = useState([]);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

  // Action States
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(null);
  const [isRemovingFromPlaylist, setIsRemovingFromPlaylist] = useState(null);

  // Error State
  const [applicationError, setApplicationError] = useState("");

  useEffect(() => {
    const initializeAuthentication = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!error && session?.user) {
          await handleUserAuthentication(session.user);
        }
      } finally {
        setIsAuthenticationLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await handleUserAuthentication(session.user);
      } else {
        handleUserSignOut();
      }
      setIsAuthenticationLoading(false);
    });

    initializeAuthentication();
    return () => subscription.unsubscribe();
  }, []);

  const handleUserAuthentication = async (user) => {
    try {
      setCurrentUser(user);

      await axios.post(`${API_BASE_URL}/api/users`, {
        id: user.id,
        email: user.email,
      });

      await loadUserPlaylist(user.id);
    } catch {
      setApplicationError("Failed to load user data");
    }
  };

  const handleUserSignOut = () => {
    setCurrentUser(null);
    setUserPlaylist([]);
    setSearchResult(null);
    setHasPerformedSearch(false);
    setArtistSearchQuery("");
    setSongSearchQuery("");
    setSelectedBPMRange("tight");
  };

  const loadUserPlaylist = async (userId) => {
    if (!userId) return;

    setIsLoadingPlaylist(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/playlists?user_id=${userId}`
      );

      const normalizedPlaylist = response.data.map((track) => ({
        ...normalizeTrackData(track),
        playlistRowId: track.id,
      }));

      setUserPlaylist(normalizedPlaylist);
    } catch {
      setApplicationError("Failed to load your playlist");
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  const searchForTrack = async () => {
    const trimmedArtist = artistSearchQuery.trim();
    const trimmedSong = songSearchQuery.trim();

    if (!trimmedArtist || !trimmedSong) {
      setApplicationError("Please enter both artist and song name");
      return;
    }

    setIsSearching(true);
    setApplicationError("");
    setHasPerformedSearch(true);

    try {
      const endpoint = `${API_BASE_URL}/api/spotify/track/${encodeURIComponent(
        trimmedArtist
      )}/${encodeURIComponent(trimmedSong)}`;

      const response = await axios.get(endpoint);

      const normalizedResponse = {
        ...response.data,
        main_track: response.data.main_track
          ? normalizeTrackData(response.data.main_track)
          : null,
        compatible_tracks: response.data.compatible_tracks
          ? response.data.compatible_tracks.map(normalizeTrackData)
          : [],
      };

      setSearchResult(normalizedResponse);
    } catch (error) {
      if (error?.response?.status === 404) {
        setApplicationError(
          `No track found for "${trimmedSong}" by "${trimmedArtist}"`
        );
      } else {
        setApplicationError("Search failed. Please try again.");
      }
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const addTrackToPlaylist = async (track) => {
    if (!currentUser) {
      setApplicationError("You must be logged in to save tracks");
      return;
    }

    const isDuplicate = userPlaylist.some(
      (p) =>
        getTrackId(p) === track.id ||
        (getTrackName(p) === track.name &&
          getTrackArtist(p) === track.artists[0].name)
    );

    if (isDuplicate) {
      setApplicationError("This track is already in your playlist");
      return;
    }

    setIsAddingToPlaylist(track.id);
    setApplicationError("");

    try {
      const normalizedTrack = normalizeTrackData(track);
      const keyInfo = extractKeyInfo(normalizedTrack);

      const response = await axios.post(`${API_BASE_URL}/api/playlists`, {
        user_id: currentUser.id,
        song_title: normalizedTrack.name,
        artist_name: normalizedTrack.artists[0].name,
        song_id: normalizedTrack.id,
        album_name: normalizedTrack.album?.name || "",
        album_image_url: normalizedTrack.album?.images?.[0]?.url || "",
        key_info: JSON.stringify({
          key: keyInfo.key,
          bpm: keyInfo.bpm,
        }),
        scraped_data: JSON.stringify(normalizedTrack.scraped_info || null),
      });

      const newPlaylistTrack = {
        ...normalizedTrack,
        playlistRowId: response.data.id,
        song_title: normalizedTrack.name,
        artist_name: normalizedTrack.artists[0].name,
        album_name: normalizedTrack.album?.name || "",
        album_image_url: normalizedTrack.album?.images?.[0]?.url || "",
        key_info: {
          key: keyInfo.key,
          bpm: keyInfo.bpm,
        },
        scraped_data: normalizedTrack.scraped_info,
      };

      setUserPlaylist((prev) => [...prev, newPlaylistTrack]);
    } catch {
      setApplicationError("Failed to add track to playlist");
    } finally {
      setIsAddingToPlaylist(null);
    }
  };

  const removeTrackFromPlaylist = async (playlistRowId) => {
    if (!playlistRowId) return;

    setIsRemovingFromPlaylist(playlistRowId);
    setApplicationError("");

    try {
      setUserPlaylist((prev) =>
        prev.filter(
          (t) => t.playlistRowId !== playlistRowId && t.id !== playlistRowId
        )
      );

      await axios.delete(`${API_BASE_URL}/api/playlists/${playlistRowId}`);
    } catch {
      setApplicationError("Failed to remove track from playlist");
      if (currentUser) {
        await loadUserPlaylist(currentUser.id);
      }
    } finally {
      setIsRemovingFromPlaylist(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      setApplicationError("Failed to sign out");
    }
  };

  const dismissError = () => setApplicationError("");

  if (isAuthenticationLoading) {
    return <LoadingSpinner message="Loading your Intune experience..." />;
  }

  const mainTrack = searchResult?.main_track
    ? normalizeTrackData(searchResult.main_track)
    : null;
  const compatibleTracks = searchResult?.compatible_tracks
    ? searchResult.compatible_tracks.map(normalizeTrackData)
    : [];

  return (
    <div className="app-container">
      <TopHeader user={currentUser} onLogout={handleLogout} />

      <MainHeader
        artistQuery={artistSearchQuery}
        songQuery={songSearchQuery}
        onArtistQueryChange={setArtistSearchQuery}
        onSongQueryChange={setSongSearchQuery}
        onSearch={searchForTrack}
        isSearching={isSearching}
      />

      <ErrorMessage error={applicationError} onDismiss={dismissError} />

      <main className="main-content">
        {isSearching ? (
          <LoadingSpinner message="Searching for compatible music..." />
        ) : (
          // Find the section in your IntuneApp.js around line 900-1000 where the two-column-layout is rendered
          // Replace the entire left-column section with this updated code:

          <div className="two-column-layout">
            <div className="left-column">
              {/* Always show the current track card - empty or populated */}
              <div className="current-song-card">
                {hasPerformedSearch && mainTrack ? (
                  <>
                    {/* POPULATED STATE - Show actual track data */}
                    <h2 className="current-song-title">Current Track</h2>

                    {/* Spotify Embed Player */}
                    <div className="main-track-player">
                      <SpotifyEmbed trackId={mainTrack.id} compact={false} />
                    </div>

                    {/* Key, BPM, and Add Button Row */}
                    <div className="song-attributes-compact">
                      <div>
                        <span>Key</span>
                        <span>{mainTrack.key_info?.key || "Unknown"}</span>
                      </div>
                      <div>
                        <span>BPM</span>
                        <span>{mainTrack.key_info?.bpm || "Unknown"}</span>
                      </div>
                      <div>
                        <StyledButton
                          onClick={() => addTrackToPlaylist(mainTrack)}
                          disabled={
                            isAddingToPlaylist === mainTrack.id ||
                            userPlaylist.some(
                              (p) =>
                                getTrackId(p) === mainTrack.id ||
                                (getTrackName(p) === mainTrack.name &&
                                  getTrackArtist(p) ===
                                    mainTrack.artists[0].name)
                            )
                          }
                          className={`add-current-track-btn ${
                            userPlaylist.some(
                              (p) =>
                                getTrackId(p) === mainTrack.id ||
                                (getTrackName(p) === mainTrack.name &&
                                  getTrackArtist(p) ===
                                    mainTrack.artists[0].name)
                            )
                              ? "already-added"
                              : ""
                          }`}
                          title={
                            userPlaylist.some(
                              (p) =>
                                getTrackId(p) === mainTrack.id ||
                                (getTrackName(p) === mainTrack.name &&
                                  getTrackArtist(p) ===
                                    mainTrack.artists[0].name)
                            )
                              ? "Already in playlist"
                              : "Add current track to playlist"
                          }
                        >
                          {isAddingToPlaylist === mainTrack.id ? (
                            <>
                              <span className="button-spinner">⏳</span>
                              Adding...
                            </>
                          ) : userPlaylist.some(
                              (p) =>
                                getTrackId(p) === mainTrack.id ||
                                (getTrackName(p) === mainTrack.name &&
                                  getTrackArtist(p) ===
                                    mainTrack.artists[0].name)
                            ) ? (
                            <>✓ Added</>
                          ) : (
                            <>+ Add to Playlist</>
                          )}
                        </StyledButton>
                      </div>
                    </div>

                    {/* Compatible Tracks Section - INSIDE THE CURRENT TRACK CARD */}
                    <div className="compatible-tracks-section">
                      <EnhancedCompatibleTracksList
                        tracks={compatibleTracks}
                        referenceBPM={mainTrack.key_info?.bpm}
                        selectedBPMRange={selectedBPMRange}
                        onRangeChange={setSelectedBPMRange}
                        onAddToPlaylist={addTrackToPlaylist}
                        isAddingToPlaylist={isAddingToPlaylist}
                        playlist={userPlaylist}
                      />
                    </div>
                  </>
                ) : hasPerformedSearch && !mainTrack ? (
                  /* SEARCH PERFORMED BUT NO RESULTS */
                  <div className="search-no-results">
                    <h2>No Results Found</h2>
                    <p>
                      No track found for "{songSearchQuery}" by "
                      {artistSearchQuery}".
                    </p>
                    <p>
                      Try checking the spelling or searching for a different
                      track.
                    </p>
                  </div>
                ) : (
                  /* EMPTY STATE - Show instructions inside the card */
                  <div className="search-instructions">
                    <h2>Find Compatible Music</h2>
                    <p>
                      Enter an artist and song name above to discover up to 20
                      harmonically compatible tracks.
                    </p>
                    <p>
                      Once you find songs you like, add them to your playlist
                      and use the BPM filter to find the perfect matches.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="right-column">
              {isLoadingPlaylist ? (
                <LoadingSpinner message="Loading your playlist..." />
              ) : (
                <UserPlaylist
                  playlist={userPlaylist}
                  onRemoveFromPlaylist={removeTrackFromPlaylist}
                  isRemovingFromPlaylist={isRemovingFromPlaylist}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IntuneApp;
