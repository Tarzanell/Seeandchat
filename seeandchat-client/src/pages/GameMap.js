import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Token from "../components/Token";

function GameMap({ character, userId, isDm, mappa_id }) {
  const [mapImage, setMapImage] = useState(null);
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchMapAndTokens = async () => {
      try {
        const resMap = await fetch(`http://217.154.16.188:3001/api/mappe/${mappa_id}`);
        const mapData = await resMap.json();
        setMapImage(mapData.immagine);

        const resTokens = await fetch(`http://217.154.16.188:3001/api/tokens/${mappa_id}`);
        const tokenData = await resTokens.json();
        setTokens(tokenData);
        console.log("Token presenti:", tokenData);
      } catch (err) {
        console.error("Errore nel caricamento di mappa o token:", err);
      }
    };

    fetchMapAndTokens();
  }, [mappa_id]);

  // Funzione per evitare sovrapposizione perfetta
  const getTokenStyle = (token, index, tokensAtSamePosition) => {
    const offset = tokensAtSamePosition.indexOf(token) * 50; // 🔹 50px di offset
    return {
      left: `${token.pos_x * 50 + offset}px`,
      top: `${token.pos_y * 50}px`
    };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          width: "500px",
          height: "500px",
          backgroundImage: `url(http://217.154.16.188:3001/uploads/mappe/${mapImage})`,
          backgroundSize: "cover",
          position: "relative",
        }}>
      
        {tokens.map((token, idx) => {
          const overlapping = tokens.filter(t => t.pos_x === token.pos_x && t.pos_y === token.pos_y);
          const positionStyle = getTokenStyle(token, idx, overlapping);
          
          return <Token character={character} userId={userId} isDm={isDm} key={token.id} token={token} positionStyle={positionStyle} />;
         })}
      </div>
    </DndProvider>
  );



}

export default GameMap;