// TrackCard.js — artwork + metadata + add/remove action 
import React from "react";
import AlbumArtwork from "./TrackArtwork";

// Local accessors for track fields (mirrors musicUtils semantics).
const getId = (t) => t?.playlistRowId || t?.id || t?.song_id;
const getArtist = (t) => t?.artists?.[0]?.name || t?.artist_name || "Unknown Artist";
const getName = (t) => t?.name || t?.song_title || t?.title || "Unknown Song";
const getKeyInfo = (t) => {
  const ki = t?.key_info;
  if (!ki) return { key: "Unknown", bpm: "Unknown" };
  if (typeof ki === "string") {
    try {
      const parsed = JSON.parse(ki);
      return { key: parsed?.key || "Unknown", bpm: parsed?.bpm || parsed?.tempo || "Unknown" };
    } catch {
      return { key: "Unknown", bpm: "Unknown" };
    }
  }
  return { key: ki.key || "Unknown", bpm: ki.bpm || ki.tempo || "Unknown" };
};
const getAlbumImage = (t) => t?.album?.images?.[0]?.url || t?.album_image_url || "";
const getAlbumName = (t) => t?.album?.name || t?.album_name || "";

// ActionButton — handles Add/Remove with a11y labels.
const ActionButton = ({ action = "add", onClick, disabled = false, busy = false, trackName }) => {
  const config = action === "remove"
    ? { label: "Remove from Playlist", icon: "×", className: "delete-button", busyLabel: "Removing..." }
    : { label: "Add to Playlist", icon: "+", className: "add-track-btn", busyLabel: "Adding..." };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`track-action-btn ${config.className}`}
      aria-label={`${config.label}: ${trackName}`}
      title={config.label}
    >
      {busy ? config.busyLabel : config.icon}
    </button>
  );
};

// Optional compatibility badge (key/BPM + source) if data is present.
const CompatibilityPill = ({ track }) => {
  const info = track?.compatibility_info;
  const keyInfo = getKeyInfo(track);
  if (!info && !keyInfo?.source) return null;

  return (
    <div className="compatibility-pill" role="note" aria-label="Track compatibility information">
      {info?.overall && (
        <div className={`compatibility-overall level-${info.overall.compatibility}`}>
          <span className="compatibility-score">{info.overall.score}%</span>
          <span className="compatibility-desc">{info.overall.description}</span>
        </div>
      )}
      <div className="compatibility-sub">
        {info?.key && (
          <div className="compatibility-item">
            <span className="compatibility-label">Key</span>
            <span className="compatibility-value">{info.key.reason}</span>
          </div>
        )}
        {info?.bpm && (
          <div className="compatibility-item">
            <span className="compatibility-label">BPM</span>
            <span className="compatibility-value">{info.bpm.reason}</span>
          </div>
        )}
        {keyInfo?.source && (
          <div className="compatibility-item">
            <span className="compatibility-label">Source</span>
            <span className="compatibility-value">{keyInfo.source}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// TrackCard: artwork + metadata + add/remove action 
const TrackCard = ({
  track,
  actionType = "add",
  isInPlaylist = false,
  isLoading = false,
  onAdd,
  onRemove,
}) => {
  const id = getId(track);
  const artist = getArtist(track);
  const name = getName(track);
  const { key, bpm } = getKeyInfo(track);
  const albumImg = getAlbumImage(track);
  const albumName = getAlbumName(track);

  const addingDisabled = actionType === "add" && isInPlaylist;

  return (
    <article className="track-card" role="group" aria-label={`${name} by ${artist}`}>
      <div className="track-card-artwork">
        <AlbumArtwork
          url={albumImg}
          name={name}
          artistName={artist}
          alt={albumName ? `${albumName} cover` : `Album artwork for ${name}`}
        />
      </div>

      <div className="track-card-body">
        <header className="track-header">
          <h3 className="track-title" title={name}>{name}</h3>
          <p className="track-artist" title={artist}>{artist}</p>
        </header>

        <dl className="track-attributes">
          <div className="attr">
            <dt className="attr-label">Key</dt>
            <dd className="attr-value">{key || "Unknown"}</dd>
          </div>
          <div className="attr">
            <dt className="attr-label">BPM</dt>
            <dd className="attr-value">{bpm || "Unknown"}</dd>
          </div>
        </dl>

        <div className="track-actions">
          {actionType === "remove" ? (
            <ActionButton
              action="remove"
              onClick={() => onRemove?.(id)}
              disabled={!id}
              busy={isLoading}
              trackName={name}
            />
          ) : (
            <>
              {isInPlaylist ? (
                <span className="already-added" aria-label="Already in playlist">✓ Added</span>
              ) : (
                <ActionButton
                  action="add"
                  onClick={() => onAdd?.(track)}
                  disabled={addingDisabled}
                  busy={isLoading}
                  trackName={name}
                />
              )}
            </>
          )}
        </div>

        <CompatibilityPill track={track} />
      </div>
    </article>
  );
};

// TrackGrid: wrapper for a grid of TrackCard children.
export const TrackGrid = ({ title, emptyMessage, children }) => (
  <section className="track-grid-container">
    {title && <h2 className="grid-title">{title}</h2>}
    {React.Children.count(children) > 0 ? (
      <div className="track-grid" role="grid">{children}</div>
    ) : (
      <div className="empty-grid">
        <p className="empty-message">{emptyMessage || "No tracks to display"}</p>
      </div>
    )}
  </section>
);

export default TrackCard;
