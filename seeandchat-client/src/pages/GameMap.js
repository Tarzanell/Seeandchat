// file in src/pages/
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Token from "../components/Token";
import SpawnNpcTransizione from "../components/SpawnNpcTransizione";
import ChatBox from "../components/ChatBox";
import CustomDragLayer from "../components/CustomDragLayer";
import MiniSchedaTiri from "../components/MiniSchedaTiri";
import MappaGlobale from "../components/MappaGlobale";
import DmTeletrasporto from "../components/DmTeletrasporto";
import lato from "../assets/latoMappa.png";
import angolo from "../assets/angoloMappa.png";

function GameMap({ character, userId, isDm, mioToken, setMioToken, setWrapperMapNome }) {
  const [mioTokenState, setMioTokenState] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [mapImage, setMapImage] = useState(null);
  const [mapWidth, setMapWidth] = useState(10);
  const [mapHeight, setMapHeight] = useState(10);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [isCombat, setIsCombat] = useState(false);
  const [velocity, setVelocity] = useState(null);
  const [remainingMovement, setRemainingMovement] = useState(null);
  const [mapNome, setmapNome] = useState(null);

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
    if (isCombat && character?.velocita) {
      setRemainingMovement(character.velocita);
    }
  }, [isCombat, character.velocita, mioTokenState?.mappa_id]);


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
        setIsCombat(mapData.isCombat);
        setVelocity(mapData.velocity);
        setmapNome(mapData.nome);
        setWrapperMapNome(mapData.nome);
        
      } catch (err) {
        console.error("Errore nel caricamento mappa o token:", err);
      }
    };


    fetchMapAndTokens();
    const interval = setInterval(fetchMapAndTokens, 5000);
    return () => clearInterval(interval);
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

  const handleFineTurno = () => {
    setRemainingMovement(character.velocita); // resetta movimento
    alert("Turno finito."); // opzionale
  };


  if (!mioTokenState) return <div>Caricamento token del personaggio...</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer dragStartPos={dragStartPos} />
  
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Bordo superiore */}
          <div style={{
            position: "absolute", top: 20, left: 50, right: 50, height: 50,
            width: `${mapWidth * 50}px`, backgroundImage: `url(${lato})`,
            backgroundRepeat: "repeat-x", zIndex: 6
          }} />
  
          {/* Bordo inferiore */}
          <div style={{
            position: "absolute", bottom: -95, left: 50, right: 50, height: 50,
            width: `${mapWidth * 50}px`, backgroundImage: `url(${lato})`,
            backgroundRepeat: "repeat-x", zIndex: 6
          }} />
  
          {/* Bordo sinistro */}
          <div style={{
            position: "absolute", top: 50, left: 55,
            width: `${mapHeight * 50}px`, height: 50,
            transform: "rotate(90deg)", transformOrigin: "top left",
            backgroundImage: `url(${lato})`, backgroundRepeat: "repeat-x", zIndex: 6
          }} />
  
          {/* Bordo destro */}
          <div style={{
            position: "absolute", top: 50, left: 245,
            width: `${mapHeight * 50}px`, height: 50,
            transform: "rotate(-90deg)", transformOrigin: "top right",
            backgroundImage: `url(${lato})`, backgroundRepeat: "repeat-x", zIndex: 6
          }} />
  
          {/* Angoli */}
          <img src={angolo} style={{ position: "absolute", top: 10, left: 10, width: 50, height: 50, transform: "scale(-1)", zIndex: 7 }} />
          <img src={angolo} style={{ position: "absolute", top: 10, right: -90, width: 50, height: 50, transform: "scaleY(-1)", zIndex: 7 }} />
          <img src={angolo} style={{ position: "absolute", bottom: -90, left: 10, width: 50, height: 50, transform: "scaleX(-1)", zIndex: 7 }} />
          <img src={angolo} style={{ position: "absolute", bottom: -90, right: -90, width: 50, height: 50, zIndex: 7 }} />
  
          {/* Mappa */}
          <div
            id="mappa"
            style={{
              width: `${mapWidth * 50}px`,
              height: `${mapHeight * 50}px`,
              top: 50,
              left: 50,
              backgroundImage: `url(http://217.154.16.188:3001/uploads/mappe/${mapImage})`,
              backgroundSize: "cover",
              position: "relative",
              zIndex: 5
            }}
          >
            {isDm && <SpawnNpcTransizione mappaId={mioTokenState.mappa_id} setTokens={setTokens} />}
            
            {isDm && (
              <div style={{ position: "absolute", height:"50px", top: 10, right: 50, zIndex: 10 }}>
                <DmTeletrasporto
                  mioToken={mioTokenState}
                  isDm={isDm}
                  refresh={() => setMioTokenState({ ...mioTokenState })}
                />
              </div>
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
                  setMousePos={setMousePos}
                  isCombat={isCombat}
                  velocity={velocity}
                  remainingMovement={remainingMovement}
                  setRemainingMovement={setRemainingMovement}
                />
              );
            })}
          </div>
        </div>
      </div>
  
      {!!isCombat && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button onClick={handleFineTurno}>Fine turno</button>
          <div style={{ marginTop: "5px" }}>
            Movimento rimanente: {Math.round(remainingMovement / 50)} metri.
          </div>
        </div>
      )}
  
      <ChatBox character={character} mioToken={mioTokenState} mapNome={mapNome} />
      <input type="hidden" value={JSON.stringify(mioTokenState)} id="token-json" />
    </DndProvider>
  );
}

export default GameMap;
