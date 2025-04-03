import React, { useEffect, useState } from "react";
import styles from "./App.css";
import BoxItem from "./BoxItem";
import BoxTitle from "./BoxTitle";
import button from "../assets/icons/more.png"
const Box = ({ url,name,album,artistName}) => {

  return (
    <div className="box">
<div>
<BoxItem key={url} url={url} name={name} artistName={artistName}/>

</div>

<div className="innerBox">
<p className="name">{artistName}</p>
{/* <p>Album: {album}</p> */}
<p className="song">{name}</p> 

</div>

<div className="addPlaylist">
<p>Add To Playlist</p>
  <div className="addButton">
<a href="#">
    <img src={button}></img></a>
  </div>


</div>
</div>)



  

    
  
};

export default Box;
