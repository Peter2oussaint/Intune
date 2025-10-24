export const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
export const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
export const SPOTIFY_URI = "https://accounts.spotify.com/authorize";
export const REDIRECT_URI = "http://localhost:3000";
export const SPACE_DELIMITER = "%20";
export const SCOPES = [
  "user-top-read",
  "user-read-private",
  "user-library-read",
  "playlist-read-private",
];

export const SCOPES_URL_PARAM = SCOPES.join(SPACE_DELIMITER);
