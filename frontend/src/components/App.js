import React, { useEffect, useState } from "react";
import {
  CLIENT_ID,
  CLIENT_SECRET,
  SPOTIFY_URI,
  REDIRECT_URI,
  SCOPES_URL_PARAM,
} from "../../../backend/auth/auth.js";
import styles from "./App.css";
import Box from "./Box.js";
import logo from "../assets/logo/INTUNE.LOGO.png";
import BoxTitle from "./BoxTitle.js";
// console.log(CLIENT_ID)
const App = () => {
  const [artistInput, setArtistInput] = useState("");
  const [songInput, setSongInput] = useState("");
  const [token, setToken] = useState("");
  const [trackImage, setTrackImage] = useState([]);
  async function handleSearch() {
    const artistParam = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    const artistSearch = await fetch(
      "https://api.spotify.com/v1/search?q=" + artistInput + "&type=artist",
      artistParam
    )
      .then((response) => response.json())
      .then((data) => {
        return data.artists.items[0].id;
      });

    const trackSearch = await fetch(
      "https://api.spotify.com/v1/artists/" + artistSearch + "/top-tracks",
      artistParam
    )
      .then((response) => response.json())
      .then((data) => {
        setTrackImage(data.tracks);
      });
  }

  useEffect(() => {
    var authParameters = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        CLIENT_ID +
        "&client_secret=" +
        CLIENT_SECRET,
    };
    fetch("https://accounts.spotify.com/api/token", authParameters)
      .then((response) => response.json())
      .then((data) => setToken(data.access_token));
  }, []);

  console.log(trackImage);
  return (
    <div>
      <div className="logoWrapper">
        <img src={logo} className="intuneLogo" />
      </div>
      <div className="searchbox">
        <label>
          <span className="span">Artist</span>
          <input
            type="text"
            placeholder="Search Artist"
            onChange={(e) => setArtistInput(e.target.value)}
          />
        </label>
        <button onClick={handleSearch}>Search</button>
      </div>
      {trackImage.map((track, i) => {
        return (
          <div>
            <Box
              url={track.album.images[0].url}
              name={track.name}
              album={track.album.name}
              artistName={track.artists[0].name}
            ></Box>
          </div>
        );
      })}
    </div>
  );
};

export default App;
