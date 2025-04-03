import React from "react";
import BoxTitle from "./BoxTitle";
// FeedItem should consist of an image (src contained in the data from the AJAX request)
const BoxItem = ({ url,name,artistName}) => {
  // put render logic here
  return (
    
     <div>

      <img src={url}/>

    </div>
  );
};



export default BoxItem;