import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Token from "../components/Token";
import SpawnNpcTransizione from "../components/SpawnNpcTransizione";
import ChatBox from "../components/ChatBox";
import CustomDragLayer from "../components/CustomDragLayer";

function GameMap({ character, userId, isDm, mioToken, setMioToken }) {
  const [mioTokenState, setMioTokenState] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [mapImage, setMapImage] = useState(null);
  const [mapWidth, setMapWidth] = useState(10);
  const [mapHeight, setMapHeight] = useState(10);
  const [dragStartPos, setDragStartPos] = useState(null);

  useEffect(() => {
    if (mioToken) {
      setMioTokenState(mioToken);
    }
  }, [mioToken]);

  useEffect(() => {
    const fetchMioToken = async () => {
      try {
        const res = await fetch(`http://217.154.16.188:3001/api/miotoken/${character.id}`);
        if (res.ok) {
          const data = await res.json();
          setMioTokenState(data);
          if (typeof setMioToken === "function") {
            setMioToken(data);
          }
        } else {
          console.error("Token del personaggio non trovato.");
        }
      } catch (err) {
        console.error("Errore nel recupero mioToken:", err);
      }
    };

    fetchMioToken();
  }, [character.id, setMioToken]);

  useEffect(() => {
    if (!mioTokenState) return;

    const fetchMapAndTokens = async () => {
      try {
        const [resMap, resTokens] = await Promise.all([
          fetch(`http://217.154.16.188:3001/api/mappe/${mioTokenState.mappa_id}`),
          fetch(`http://217.154.16.188:3001/api/tokens/${mioTokenState.mappa_id}`)
        ]);

        if (!resMap.ok || !resTokens.ok) {
          throw new Error("Errore nel caricamento dati");
        }

        const mapData = await resMap.json();
        const tokenData = await resTokens.json();

        setMapImage(mapData.immagine);
        setMapWidth(mapData.larghezza || 10);
        setMapHeight(mapData.altezza || 10);
        setTokens(tokenData);
      } catch (err) {
        console.error("Errore nel caricamento mappa o token:", err);
      }
    };

    fetchMapAndTokens();
  }, [mioTokenState?.mappa_id]);

  useEffect(() => {
    const aggiornato = tokens.find(t => t.categoria === "personaggio" && t.fatherid === character.id);
    if (aggiornato) setMioTokenState(aggiornato);
  }, [tokens, character.id]);

  const getTokenStyle = (token, index, tokensAtSamePosition) => {
    const offset = tokensAtSamePosition.indexOf(token) * 50;
    return {
      left: `${token.posizione_x * 50 + offset}px`,
      top: `${token.posizione_y * 50}px`,
    };
  };

  if (!mioTokenState) return <div>Caricamento token del personaggio...</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer dragStartPos={dragStartPos} />
      <div
        id="mappa"
        style={{
          width: `${mapWidth * 50}px`,
          height: `${mapHeight * 50}px`,
          backgroundImage: `url(http://217.154.16.188:3001/uploads/mappe/${mapImage})`,
          backgroundSize: "cover",
          position: "relative",
        }}
      >
        {isDm && (
          <SpawnNpcTransizione mappaId={mioTokenState.mappa_id} setTokens={setTokens} />
        )}

        {tokens.map((token, idx) => {
          const overlapping = tokens.filter(
            (t) => t.posizione_x === token.posizione_x && t.posizione_y === token.posizione_y
          );
          const positionStyle = getTokenStyle(token, idx, overlapping);

          return (
            <Token
              key={token.id}
              token={token}
              characterToken={mioTokenState}
              positionStyle={positionStyle}
              character={character}
              userId={userId}
              isDm={isDm}
              setTokens={setTokens}
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              setDragStartPos={setDragStartPos}
            />
          );
        })}
      </div>
      <ChatBox character={character} mioToken={mioTokenState} />
      <input type="hidden" value={JSON.stringify(mioTokenState)} id="token-json" />
    </DndProvider>
  );
}

export default GameMap;
