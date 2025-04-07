import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameMap from "./GameMap";
import MappaGlobale from "../components/MappaGlobale";
import GiocatoriOnlinePopup from "../components/GiocatoriOnlinePopup"; // Assicurati che il path sia corretto

function GameMapWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMappaGlobale, setShowMappaGlobale] = useState(false);
  const [showGiocatoriOnline, setShowGiocatoriOnline] = useState(false);

  const character = location.state?.character;
  const userId = location.state?.userId;
  const isDm = location.state?.isDm;

  const [mioToken, setMioToken] = useState(null);

  useEffect(() => {
    if (!character) {
      navigate("/characters");
    }
  }, [character, navigate]);

  useEffect(() => {
    if (!mioToken) return;

    const token = localStorage.getItem("token");

    const controllaMappa = async () => {
      try {
        const res = await fetch(`http://217.154.16.188:3001/api/token/${mioToken.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.mappa_id !== mioToken.mappa_id) {
            console.log("Cambio mappa rilevato. Ricarico pagina...");
            setMioToken(data);
          }
        }
      } catch (err) {
        console.error("Errore nel polling mappa:", err);
      }
    };

    const intervallo = setInterval(controllaMappa, 10000);
    return () => clearInterval(intervallo);
  }, [mioToken]);

  if (!character) return null;

  return (
    <div>
      {/* 🔹 Barra di navigazione fissa */}
      <div style={{
        backgroundColor: "#f5f5f5",
        padding: "10px",
        borderBottom: "1px solid #ccc",
        display: "flex",
        gap: "10px"
      }}>
        {!isDm && <button onClick={() => navigate("/characters")}>Torna ai Personaggi</button>}
        {isDm && <button onClick={() => navigate("/dmdashboard")}>Vai al DM Dashboard</button>}
        <button onClick={() => setShowMappaGlobale(prev => !prev)}>
          {showMappaGlobale ? "Chiudi Mappa Globale" : "Apri Mappa Globale"}
        </button>
        {isDm && (
          <button onClick={() => setShowGiocatoriOnline(prev => !prev)}>
            {showGiocatoriOnline ? "Chiudi Giocatori Online" : "Giocatori Online"}
          </button>
        )}
      </div>

      {/* 🔸 Mappa */}
      <GameMap
        character={character}
        userId={userId}
        isDm={isDm}
        mioToken={mioToken}
        setMioToken={setMioToken}
      />

      {showMappaGlobale && (
        <MappaGlobale character={character} mioToken={mioToken} />
      )}

      {showGiocatoriOnline && (
        <GiocatoriOnlinePopup />
      )}
    </div>
  );
}

export default GameMapWrapper;