import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Token from "../components/Token";
import SpawnNpcTransizione from "../components/SpawnNpcTransizione";

function GameMap({ character, userId, isDm}) {
  const mappa_id = character.mappa_id;
  const [mapImage, setMapImage] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [mapWidth, setMapWidth] = useState(10);
  const [mapHeight, setMapHeight] = useState(10);
  const [showSpawnPanel, setShowSpawnPanel] = useState(false);

  useEffect(() => {
    const fetchMapAndTokens = async () => {
      try {
        const resMap = await fetch(`http://217.154.16.188:3001/api/mappe/${mappa_id}`);
        const mapData = await resMap.json();
        setMapImage(mapData.immagine);
        setMapWidth(mapData.larghezza);
        setMapHeight(mapData.altezza);

        const resTokens = await fetch(`http://217.154.16.188:3001/api/tokens/${mappa_id}`);
        const tokenData = await resTokens.json();
        setTokens(tokenData);
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
      left: `${token.posizione_x * 50 + offset}px`,
      top: `${token.posizione_y * 50}px`
    };
  };

  return (
    

    <DndProvider backend={HTML5Backend}>
      <div
        style={{
          width: `${mapWidth * 50}px`,
          height: `${mapHeight * 50}px`,
          backgroundImage: `url(http://217.154.16.188:3001/uploads/mappe/${mapImage})`,
          backgroundSize: "cover",
          position: "relative",
        }}>
      
        {isDm && (
          <button onClick={() => setShowSpawnPanel(!showSpawnPanel)} style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}>
          Spawn NPC/Transizione
          </button>
          )}
    
        {showSpawnPanel && (
          <SpawnNpcTransizione mappaId={character.mappa_id} setTokens={setTokens} />
        )}

        {tokens.map((token, idx) => {
          const overlapping = tokens.filter(t => t.posizione_x === token.posizione_x && t.posizione_y === token.posizione_y);
          const positionStyle = getTokenStyle(token, idx, overlapping);
          
          return <Token character={character} mapWidth={mapWidth} mapHeight={mapHeight} userId={userId} isDm={isDm} key={token.id} token={token} positionStyle={positionStyle} setTokens={setTokens} />;
         })}


      </div>
    </DndProvider>
  );



}

export default GameMap;