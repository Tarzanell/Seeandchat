// file in src/pages/
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameMap from "./GameMap";
import MappaGlobale from "../components/MappaGlobale";
import GiocatoriOnlinePopup from "../components/GiocatoriOnlinePopup"; // Assicurati che il path sia corretto
import MissivePopup from "../components/MissivePopup";
import MiniSchedaTiri from "../components/MiniSchedaTiri";
import sfondo from "../assets/sfondoNero.png";

function GameMapWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMappaGlobale, setShowMappaGlobale] = useState(false);
  const [showGiocatoriOnline, setShowGiocatoriOnline] = useState(false);
  const [mostraMissive, setMostraMissive] = useState(false);
  const [mostraSchedaTiri, setMostraSchedaTiri] = useState(false);
  const [mapNome, setWrapperMapNome] = useState("");

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
    
    <div style={{
      backgroundImage: `url(${sfondo})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      minHeight: "100vh",
    }}>

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
        
        <button onClick={() => setShowGiocatoriOnline(prev => !prev)}>
          {showGiocatoriOnline ? "Chiudi Giocatori Online" : "Giocatori Online"}
        </button>
        
        <button onClick={() => setMostraMissive(prev => !prev)}>
          {mostraMissive ? "Chiudi Missive" : "Missive"}
        </button>

        <button onClick={() => setMostraSchedaTiri(prev => !prev)}>
          {mostraMissive ? "Chiudi Tiri Rapidi" : "Tiri Rapidi"}
        </button>

        
      </div>

      {/* 🔸 Mappa */}
      <GameMap
        character={character}
        userId={userId}
        isDm={isDm}
        mioToken={mioToken}
        setMioToken={setMioToken}
        setWrapperMapNome={setWrapperMapNome}
      />

      {showMappaGlobale && (
        <MappaGlobale 
        character={character} 
        mioToken={mioToken} 
        onClose={() => setShowMappaGlobale(false)}
        />
      )}

      {showGiocatoriOnline && (
        <GiocatoriOnlinePopup 
        mioToken={mioToken}
        onClose={() => setShowGiocatoriOnline(false)}
        />
      )}

      {mostraMissive && (
        <MissivePopup 
        mioToken={mioToken}
        onClose={() => setMostraMissive(false)}
        />
      )}

      {mostraSchedaTiri && (
        <MiniSchedaTiri
        character={character}
        mioToken={mioToken}
        mapNome={mapNome}
        onClose={() => setMostraSchedaTiri(false)}
        />
      )}

    </div>
  );
}

export default GameMapWrapper;